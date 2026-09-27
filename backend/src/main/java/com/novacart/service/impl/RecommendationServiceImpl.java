package com.novacart.service.impl;

import com.novacart.dto.response.ProductResponse;
import com.novacart.entity.Category;
import com.novacart.entity.Product;
import com.novacart.entity.ProductImage;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.CategoryRepository;
import com.novacart.repository.ProductRepository;
import com.novacart.repository.UserRepository;
import com.novacart.service.CategoryService;
import com.novacart.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getSimilarProducts(Long productId, int limit) {
        Product current = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Get root category for strict category isolation
        Category cat = current.getCategory();
        Long rootId = getRootCategoryId(cat);

        List<Long> categoryIds = categoryRepository.findSelfAndDescendantIds(List.of(rootId != null ? rootId : cat.getId()));

        int fetchSize = Math.max(limit * 2, 16);
        Pageable pageable = PageRequest.of(0, fetchSize);

        List<Product> rawMatches = productRepository.findSimilarProducts(
                productId, categoryIds, current.getBrand(), pageable
        );

        // Sort & rank based on relevance: same brand first, then price proximity (+/- 40%)
        BigDecimal curPrice = current.getPrice();
        List<Product> ranked = rawMatches.stream()
                .filter(p -> !p.getId().equals(productId))
                .sorted((a, b) -> {
                    boolean aBrand = current.getBrand() != null && current.getBrand().equalsIgnoreCase(a.getBrand());
                    boolean bBrand = current.getBrand() != null && current.getBrand().equalsIgnoreCase(b.getBrand());
                    if (aBrand && !bBrand) return -1;
                    if (!aBrand && bBrand) return 1;

                    // Price proximity
                    double aDiff = Math.abs(a.getPrice().subtract(curPrice).doubleValue());
                    double bDiff = Math.abs(b.getPrice().subtract(curPrice).doubleValue());
                    return Double.compare(aDiff, bDiff);
                })
                .limit(limit)
                .toList();

        return ranked.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getRecommendedForYou(String userEmail, int limit) {
        // Fallback to top-rated diverse products across all categories
        Pageable pageable = PageRequest.of(0, Math.max(limit, 12));
        List<Product> topRated = productRepository.findTopRatedGlobal(pageable);
        return topRated.stream().limit(limit).map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getCompleteTheLook(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Category cat = product.getCategory();
        Long rootId = getRootCategoryId(cat);
        String nameLower = product.getName().toLowerCase();

        List<ProductResponse> completeLook = new ArrayList<>();

        // If Fashion or Shoes (Root 4 or 5)
        if (rootId != null && (rootId == 4L || rootId == 5L)) {
            // Find Men's vs Women's
            boolean isMen = nameLower.contains("men") || nameLower.contains("boy") || nameLower.contains("male");

            // Look up complementary subcategories
            List<String> targetSlugs = new ArrayList<>();
            if (nameLower.contains("shirt") || nameLower.contains("polo") || nameLower.contains("t-shirt") || nameLower.contains("tee")) {
                targetSlugs.addAll(List.of("mens-jeans", "sports-shoes", "mens-shoes", "watches-accessories", "jackets-hoodies"));
            } else if (nameLower.contains("jean") || nameLower.contains("trouser") || nameLower.contains("pant")) {
                targetSlugs.addAll(List.of("mens-tshirts", "mens-shirts", "sports-shoes", "watches-accessories"));
            } else if (nameLower.contains("shoe") || nameLower.contains("sneaker")) {
                targetSlugs.addAll(List.of("mens-jeans", "mens-tshirts", "watches-accessories", "jackets-hoodies"));
            } else if (nameLower.contains("dress") || nameLower.contains("saree") || nameLower.contains("kurti")) {
                targetSlugs.addAll(List.of("womens-shoes", "womens-sandals", "handbags-clutches", "watches-accessories"));
            } else {
                targetSlugs.addAll(List.of("mens-jeans", "sports-shoes", "handbags-clutches", "watches-accessories"));
            }

            for (String slug : targetSlugs) {
                List<Long> ids = categoryService.resolveCategoryIds(slug, null);
                if (ids != null && !ids.isEmpty()) {
                    List<Product> items = productRepository.findTopRatedInCategory(ids, productId, PageRequest.of(0, 1));
                    if (!items.isEmpty()) {
                        completeLook.add(toResponse(items.get(0)));
                    }
                }
            }
        } else if (rootId != null && rootId == 2L) {
            // Mobile complementary: Cases & Covers, Chargers, Power Banks, Earbuds
            List<String> mobSlugs = List.of("cases-covers", "chargers-cables", "power-banks", "headphones");
            for (String slug : mobSlugs) {
                List<Long> ids = categoryService.resolveCategoryIds(slug, null);
                if (ids != null && !ids.isEmpty()) {
                    List<Product> items = productRepository.findTopRatedInCategory(ids, productId, PageRequest.of(0, 1));
                    if (!items.isEmpty()) {
                        completeLook.add(toResponse(items.get(0)));
                    }
                }
            }
        } else if (rootId != null && rootId == 11L) {
            // Sports complementary: Cricket Bat -> Ball, Gloves, Pads, Kit bag
            List<String> sportsSlugs = List.of("cricket-gear", "sports-accessories", "gym-fitness", "yoga-meditation");
            for (String slug : sportsSlugs) {
                List<Long> ids = categoryService.resolveCategoryIds(slug, null);
                if (ids != null && !ids.isEmpty()) {
                    List<Product> items = productRepository.findTopRatedInCategory(ids, productId, PageRequest.of(0, 1));
                    if (!items.isEmpty()) {
                        completeLook.add(toResponse(items.get(0)));
                    }
                }
            }
        } else if (rootId != null && rootId == 3L) {
            // Electronics (Laptops/Cameras) -> Backpack, Mouse, Audio
            List<String> elecSlugs = List.of("computer-accessories", "headphones", "speakers", "school-bags");
            for (String slug : elecSlugs) {
                List<Long> ids = categoryService.resolveCategoryIds(slug, null);
                if (ids != null && !ids.isEmpty()) {
                    List<Product> items = productRepository.findTopRatedInCategory(ids, productId, PageRequest.of(0, 1));
                    if (!items.isEmpty()) {
                        completeLook.add(toResponse(items.get(0)));
                    }
                }
            }
        }

        return completeLook;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getFrequentlyBoughtTogether(Long productId) {
        Product current = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        List<ProductResponse> bundle = new ArrayList<>();
        bundle.add(toResponse(current));

        Category cat = current.getCategory();
        Long rootId = getRootCategoryId(cat);

        // Fetch 2 highly relevant accessories in same domain
        List<String> targetSlugs = switch (rootId != null ? rootId.intValue() : 0) {
            case 2 -> List.of("cases-covers", "chargers-cables");
            case 3 -> List.of("computer-accessories", "headphones");
            case 4 -> List.of("watches-accessories", "mens-jeans");
            case 5 -> List.of("sports-accessories", "mens-tshirts");
            case 6 -> List.of("stationery", "school-bags");
            case 7 -> List.of("storage-organisation", "dinnerware");
            case 8 -> List.of("cleansers", "skincare");
            case 9 -> List.of("lighting", "curtains-rugs");
            case 10 -> List.of("board-games", "learning-toys");
            case 11 -> List.of("sports-accessories", "resistance-fitness");
            default -> List.of("snacks-beverages", "breakfast-sauces");
        };

        for (String slug : targetSlugs) {
            List<Long> ids = categoryService.resolveCategoryIds(slug, null);
            if (ids != null && !ids.isEmpty()) {
                List<Product> items = productRepository.findTopRatedInCategory(ids, productId, PageRequest.of(0, 1));
                if (!items.isEmpty()) {
                    bundle.add(toResponse(items.get(0)));
                }
            }
        }

        return bundle;
    }

    private Long getRootCategoryId(Category cat) {
        if (cat == null) return null;
        if (cat.getParent() == null) return cat.getId();
        Category curr = cat;
        while (curr.getParent() != null) {
            curr = curr.getParent();
        }
        return curr.getId();
    }

    private ProductResponse toResponse(Product p) {
        BigDecimal discount = p.getDiscountPercent() == null ? BigDecimal.ZERO : p.getDiscountPercent();
        BigDecimal effectivePrice = p.getPrice()
                .multiply(BigDecimal.ONE.subtract(discount.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);

        Integer stock = p.getInventory() == null ? 0 : p.getInventory().getStockQuantity();
        List<String> images = p.getImages() == null ? List.of() :
                p.getImages().stream().map(ProductImage::getUrl).toList();

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .specifications(p.getSpecifications())
                .brand(p.getBrand())
                .color(p.getColor())
                .size(p.getSize())
                .price(p.getPrice())
                .discountPercent(discount)
                .effectivePrice(effectivePrice)
                .averageRating(p.getAverageRating())
                .reviewCount(p.getReviewCount())
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .sellerName(p.getSeller() != null ? p.getSeller().getBusinessName() : null)
                .sellerId(p.getSeller() != null ? p.getSeller().getId() : null)
                .stockQuantity(stock)
                .inStock(stock != null && stock > 0)
                .images(images)
                .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null)
                .build();
    }
}

package com.novacart.service.impl;

import com.novacart.dto.request.ProductRequest;
import com.novacart.dto.response.PageResponse;
import com.novacart.dto.response.ProductResponse;
import com.novacart.entity.*;
import com.novacart.exception.ForbiddenException;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.*;
import com.novacart.service.CategoryService;
import com.novacart.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final SellerRepository sellerRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(String keyword, Long categoryId, String categorySlug, BigDecimal minPrice,
                                                 BigDecimal maxPrice, Long sellerId, Double minRating,
                                                 String sortBy, String brand, String color, String size,
                                                 BigDecimal minDiscount, Pageable pageable) {
        
        // Smart Natural Language Query Parsing
        if (keyword != null && !keyword.isBlank()) {
            ParsedQuery parsed = parseNaturalLanguageQuery(keyword);
            if (categorySlug == null || categorySlug.isBlank()) {
                categorySlug = parsed.categorySlug();
            }
            if (maxPrice == null && parsed.maxPrice() != null) {
                maxPrice = parsed.maxPrice();
            }
            if (color == null && parsed.color() != null) {
                color = parsed.color();
            }
            if (brand == null && parsed.brand() != null) {
                brand = parsed.brand();
            }
            keyword = parsed.cleanKeyword();
        }

        List<Long> categoryIds = categoryService.resolveCategoryIds(categorySlug, categoryId);

        Sort sort = switch (sortBy == null ? "" : sortBy) {
            case "price_asc"  -> Sort.by("price").ascending();
            case "price_desc" -> Sort.by("price").descending();
            case "rating"     -> Sort.by("averageRating").descending();
            case "newest"     -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
            case "popularity" -> Sort.by("reviewCount").descending();
            case "discount"   -> Sort.by("discountPercent").descending();
            default           -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        };
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        final String finalKeyword = keyword != null && !keyword.isBlank() ? keyword.trim() : null;
        final BigDecimal filterMinPrice = minPrice;
        final BigDecimal filterMaxPrice = maxPrice;
        final String filterBrand = brand != null && !brand.isBlank() ? brand.trim() : null;
        final String filterColor = color != null && !color.isBlank() ? color.trim() : null;
        final String filterSize = size != null && !size.isBlank() ? size.trim() : null;
        final BigDecimal filterMinDiscount = minDiscount;
        final Double filterMinRating = minRating;
        final Long filterSellerId = sellerId;
        final List<Long> filterCategoryIds = categoryIds;

        org.springframework.data.jpa.domain.Specification<Product> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("active")));

            if (finalKeyword != null) {
                String pattern = "%" + finalKeyword.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("brand")), pattern)
                ));
            }

            if (filterCategoryIds != null && !filterCategoryIds.isEmpty()) {
                predicates.add(root.get("category").get("id").in(filterCategoryIds));
            }

            if (filterMinPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), filterMinPrice));
            }

            if (filterMaxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), filterMaxPrice));
            }

            if (filterSellerId != null) {
                predicates.add(cb.equal(root.get("seller").get("id"), filterSellerId));
            }

            if (filterMinRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("averageRating"), filterMinRating));
            }

            if (filterBrand != null) {
                predicates.add(cb.equal(cb.lower(root.get("brand")), filterBrand.toLowerCase()));
            }

            if (filterColor != null) {
                predicates.add(cb.like(cb.lower(root.get("color")), "%" + filterColor.toLowerCase() + "%"));
            }

            if (filterSize != null) {
                String sizePattern = "%" + filterSize.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("size")), sizePattern),
                    cb.like(cb.lower(root.get("specifications")), sizePattern)
                ));
            }

            if (filterMinDiscount != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("discountPercent"), filterMinDiscount));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Product> page = productRepository.findAll(spec, sortedPageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<ProductResponse> searchByImage(org.springframework.web.multipart.MultipartFile file, String imageUrl) {
        String queryTerm = "shoes";
        if (file != null && file.getOriginalFilename() != null) {
            String fname = file.getOriginalFilename().toLowerCase();
            if (fname.contains("phone") || fname.contains("mobile") || fname.contains("iphone")) queryTerm = "phone";
            else if (fname.contains("shirt") || fname.contains("cloth") || fname.contains("dress") || fname.contains("fashion")) queryTerm = "shirt";
            else if (fname.contains("shoe") || fname.contains("sneaker") || fname.contains("running")) queryTerm = "running shoes";
            else if (fname.contains("watch") || fname.contains("smartwatch")) queryTerm = "smartwatch";
            else if (fname.contains("laptop") || fname.contains("computer")) queryTerm = "laptop";
            else if (fname.contains("headphone") || fname.contains("earbud")) queryTerm = "headphones";
            else if (fname.contains("bat") || fname.contains("cricket") || fname.contains("sport")) queryTerm = "cricket bat";
            else if (fname.contains("beauty") || fname.contains("cream") || fname.contains("wash")) queryTerm = "face wash";
            else if (fname.contains("sofa") || fname.contains("chair") || fname.contains("furniture")) queryTerm = "sofa";
        } else if (imageUrl != null && !imageUrl.isBlank()) {
            String u = imageUrl.toLowerCase();
            if (u.contains("phone")) queryTerm = "phone";
            else if (u.contains("shoe")) queryTerm = "shoes";
            else if (u.contains("shirt")) queryTerm = "shirt";
        }

        PageResponse<ProductResponse> resp = search(queryTerm, null, null, null, null, null, null, "rating", null, null, null, null, PageRequest.of(0, 12));
        return resp.getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.novacart.dto.response.SearchSuggestionResponse> getSuggestions(String query, int limit) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }

        String rawQuery = query.trim();
        ParsedQuery parsed = parseNaturalLanguageQuery(rawQuery);
        String searchTerm = parsed.cleanKeyword() != null ? parsed.cleanKeyword() : rawQuery;
        String categorySlug = parsed.categorySlug();

        List<com.novacart.dto.response.SearchSuggestionResponse> suggestions = new java.util.ArrayList<>();
        java.util.Set<String> seenTitles = new java.util.HashSet<>();

        // 1. If category intent is detected, add category shortcut item
        if (categorySlug != null) {
            categoryRepository.findBySlug(categorySlug).ifPresent(cat -> {
                suggestions.add(com.novacart.dto.response.SearchSuggestionResponse.builder()
                        .type("CATEGORY")
                        .title(rawQuery)
                        .categoryName(cat.getName())
                        .categorySlug(cat.getSlug())
                        .targetUrl("/products?category=" + cat.getSlug() + "&keyword=" + java.net.URLEncoder.encode(rawQuery, java.nio.charset.StandardCharsets.UTF_8))
                        .build());
            });
        }

        // 2. Fetch matched products from repository
        List<Product> products = productRepository.findSearchSuggestions(searchTerm, PageRequest.of(0, Math.max(limit * 3, 20)));

        // If category slug exists, prioritize products belonging to that category
        if (categorySlug != null) {
            List<Long> catIds = categoryService.resolveCategoryIds(categorySlug, null);
            if (catIds != null && !catIds.isEmpty()) {
                products = products.stream()
                        .sorted((p1, p2) -> {
                            boolean p1Match = p1.getCategory() != null && catIds.contains(p1.getCategory().getId());
                            boolean p2Match = p2.getCategory() != null && catIds.contains(p2.getCategory().getId());
                            if (p1Match && !p2Match) return -1;
                            if (!p1Match && p2Match) return 1;
                            return 0;
                        })
                        .toList();
            }
        }

        for (Product p : products) {
            if (suggestions.size() >= limit) break;

            // Deduplicate similar titles
            String normalizedTitle = p.getName().toLowerCase().replaceAll("[^a-z0-9]", " ").trim();
            String prefixKey = normalizedTitle.length() > 25 ? normalizedTitle.substring(0, 25) : normalizedTitle;
            if (seenTitles.contains(prefixKey)) {
                continue;
            }
            seenTitles.add(prefixKey);

            BigDecimal discount = p.getDiscountPercent() == null ? BigDecimal.ZERO : p.getDiscountPercent();
            BigDecimal effectivePrice = p.getPrice()
                    .multiply(BigDecimal.ONE.subtract(discount.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                    .setScale(2, RoundingMode.HALF_UP);

            String img = p.getImages() != null && !p.getImages().isEmpty() ? p.getImages().get(0).getUrl() : null;

            suggestions.add(com.novacart.dto.response.SearchSuggestionResponse.builder()
                    .type("PRODUCT")
                    .id(p.getId())
                    .title(p.getName())
                    .brand(p.getBrand())
                    .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                    .categorySlug(p.getCategory() != null ? p.getCategory().getSlug() : null)
                    .imageUrl(img)
                    .price(p.getPrice())
                    .effectivePrice(effectivePrice)
                    .discountPercent(discount)
                    .targetUrl("/products/" + p.getId())
                    .build());
        }

        return suggestions;
    }

    private record ParsedQuery(String cleanKeyword, String categorySlug, BigDecimal maxPrice, String color, String brand, String size) {}

    private ParsedQuery parseNaturalLanguageQuery(String raw) {
        String text = raw.trim();
        BigDecimal maxPrice = null;
        String color = null;
        String brand = null;
        String categorySlug = null;

        // 1. Extract Price (e.g., "under 1500", "under ₹3000", "below 2000", "less than 500")
        java.util.regex.Pattern pricePattern = java.util.regex.Pattern.compile("(?i)(?:under|below|less than|within)\\s*(?:₹|rs\\.?|inr)?\\s*(\\d+(?:\\.\\d+)?)");
        java.util.regex.Matcher priceMatcher = pricePattern.matcher(text);
        if (priceMatcher.find()) {
            try {
                maxPrice = new BigDecimal(priceMatcher.group(1));
                text = priceMatcher.replaceAll("").trim();
            } catch (Exception ignored) {}
        }

        // 2. Extract Color (e.g. black, white, blue, red, green, etc.)
        List<String> colors = List.of("black", "white", "navy", "blue", "red", "green", "yellow", "pink", "grey", "gray", "maroon", "orange", "purple", "brown", "gold", "silver");
        for (String c : colors) {
            java.util.regex.Pattern colorPattern = java.util.regex.Pattern.compile("(?i)\\b" + c + "\\b");
            if (colorPattern.matcher(text).find()) {
                color = c;
                text = colorPattern.matcher(text).replaceAll("").trim();
                break;
            }
        }

        // 3. Extract Category Intent
        String tLower = text.toLowerCase();
        if (tLower.contains("running shoe") || tLower.contains("sports shoe") || tLower.contains("sneaker") || tLower.contains("shoes") || tLower.contains("shoe") || tLower.contains("loafer") || tLower.contains("sandal") || tLower.contains("footwear") || tLower.contains("slippers") || tLower.contains("heels") || tLower.contains("boots")) {
            categorySlug = "shoes-footwear";
        } else if (tLower.contains("t-shirt") || tLower.contains("tshirt") || tLower.contains("shirt") || tLower.contains("jeans") || tLower.contains("trouser") || tLower.contains("dress") || tLower.contains("saree") || tLower.contains("kurti") || tLower.contains("hoodie") || tLower.contains("jacket") || tLower.contains("clothing") || tLower.contains("fashion") || tLower.contains("innerwear") || tLower.contains("blazer") || tLower.contains("suit")) {
            categorySlug = "fashion";
        } else if (tLower.contains("iphone") || tLower.contains("smartphone") || tLower.contains("mobile phone") || tLower.contains("mobile") || tLower.contains("oneplus") || tLower.contains("samsung galaxy") || tLower.contains("redmi") || tLower.contains("realme") || tLower.contains("vivo") || tLower.contains("oppo") || tLower.contains("poco")) {
            categorySlug = "mobiles";
        } else if (tLower.contains("cricket") || tLower.contains("bat") || tLower.contains("football") || tLower.contains("badminton") || tLower.contains("tennis") || tLower.contains("dumbbell") || tLower.contains("yoga mat") || tLower.contains("gym") || tLower.contains("fitness") || tLower.contains("shuttlecock") || tLower.contains("racket") || tLower.contains("treadmill")) {
            categorySlug = "sports-fitness";
        } else if (tLower.contains("face wash") || tLower.contains("facewash") || tLower.contains("serum") || tLower.contains("cream") || tLower.contains("lipstick") || tLower.contains("shampoo") || tLower.contains("perfume") || tLower.contains("fragrance") || tLower.contains("makeup") || tLower.contains("skincare") || tLower.contains("beauty") || tLower.contains("sunscreen") || tLower.contains("moisturizer") || tLower.contains("lotion") || tLower.contains("body wash")) {
            categorySlug = "beauty-personal-care";
        } else if (tLower.contains("rice") || tLower.contains("atta") || tLower.contains("dal") || tLower.contains("oil") || tLower.contains("biscuit") || tLower.contains("tea") || tLower.contains("coffee") || tLower.contains("snack") || tLower.contains("grocery") || tLower.contains("groceries") || tLower.contains("masala") || tLower.contains("sugar") || tLower.contains("salt") || tLower.contains("noodle") || tLower.contains("detergent") || tLower.contains("cleaning")) {
            categorySlug = "groceries-household";
        } else if (tLower.contains("laptop") || tLower.contains("headphone") || tLower.contains("earbud") || tLower.contains("earphone") || tLower.contains("camera") || tLower.contains("tv") || tLower.contains("television") || tLower.contains("speaker") || tLower.contains("soundbar") || tLower.contains("smartwatch") || tLower.contains("tablet") || tLower.contains("ipad") || tLower.contains("electronics") || tLower.contains("macbook") || tLower.contains("monitor") || tLower.contains("charger") || tLower.contains("phone case") || tLower.contains("power bank")) {
            categorySlug = "electronics";
        } else if (tLower.contains("cookware") || tLower.contains("pan") || tLower.contains("cooker") || tLower.contains("mixer grinder") || tLower.contains("blender") || tLower.contains("kettle") || tLower.contains("toaster") || tLower.contains("induction") || tLower.contains("utensil") || tLower.contains("kitchen") || tLower.contains("bedsheet") || tLower.contains("pillow") || tLower.contains("blanket") || tLower.contains("refrigerator") || tLower.contains("fridge")) {
            categorySlug = "home-kitchen";
        } else if (tLower.contains("sofa") || tLower.contains("couch") || tLower.contains("desk") || tLower.contains("table") || tLower.contains("chair") || tLower.contains("bed") || tLower.contains("mattress") || tLower.contains("clock") || tLower.contains("lamp") || tLower.contains("rug") || tLower.contains("curtain") || tLower.contains("furniture") || tLower.contains("decor") || tLower.contains("wardrobe")) {
            categorySlug = "furniture-home-decor";
        } else if (tLower.contains("toy") || tLower.contains("toys") || tLower.contains("lego") || tLower.contains("doll") || tLower.contains("board game") || tLower.contains("puzzle") || tLower.contains("action figure") || tLower.contains("rc car") || tLower.contains("baby toy") || tLower.contains("kids toy")) {
            categorySlug = "toys-kids";
        } else if (tLower.contains("book") || tLower.contains("books") || tLower.contains("novel") || tLower.contains("fiction") || tLower.contains("stationery") || tLower.contains("pen") || tLower.contains("school bag") || tLower.contains("notebook") || tLower.contains("diary")) {
            categorySlug = "books-stationery";
        }

        // Clean extra qualifiers like "men's", "womens", "for men", "for women"
        text = text.replaceAll("(?i)\\b(men's|mens|women's|womens|for men|for women|for kids|men|women)\\b", "").trim();
        text = text.replaceAll("\\s+", " ").trim();

        return new ParsedQuery(text.isEmpty() ? null : text, categorySlug, maxPrice, color, brand, null);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse create(String sellerEmail, boolean isAdmin, ProductRequest request) {
        Seller seller = isAdmin ? sellerRepository.findAll().get(0) : requireApprovedSeller(sellerEmail);
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Product product = Product.builder()
                .seller(seller)
                .category(category)
                .name(request.getName())
                .description(request.getDescription())
                .specifications(request.getSpecifications())
                .brand(request.getBrand())
                .color(request.getColor())
                .size(request.getSize())
                .price(request.getPrice())
                .discountPercent(request.getDiscountPercent() == null ? BigDecimal.ZERO : request.getDiscountPercent())
                .active(true)
                .build();
        product = productRepository.save(product);

        Inventory inventory = Inventory.builder()
                .product(product)
                .stockQuantity(request.getStockQuantity())
                .lowStockThreshold(request.getLowStockThreshold() == null ? 5 : request.getLowStockThreshold())
                .build();
        inventoryRepository.save(inventory);
        product.setInventory(inventory);

        return toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse update(String sellerEmail, boolean isAdmin, Long productId, ProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!isAdmin) {
            Seller seller = requireApprovedSeller(sellerEmail);
            if (!product.getSeller().getId().equals(seller.getId())) {
                throw new ForbiddenException("You can only edit your own products");
            }
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setSpecifications(request.getSpecifications());
        product.setBrand(request.getBrand());
        product.setColor(request.getColor());
        product.setSize(request.getSize());
        product.setPrice(request.getPrice());
        product.setDiscountPercent(request.getDiscountPercent() == null ? BigDecimal.ZERO : request.getDiscountPercent());
        product.setCategory(category);
        productRepository.save(product);

        if (product.getInventory() != null) {
            product.getInventory().setStockQuantity(request.getStockQuantity());
            if (request.getLowStockThreshold() != null) {
                product.getInventory().setLowStockThreshold(request.getLowStockThreshold());
            }
            inventoryRepository.save(product.getInventory());
        }

        return toResponse(product);
    }

    @Override
    @Transactional
    public void delete(String sellerEmail, boolean isAdmin, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        if (!isAdmin) {
            Seller seller = requireApprovedSeller(sellerEmail);
            if (!product.getSeller().getId().equals(seller.getId())) {
                throw new ForbiddenException("You can only delete your own products");
            }
        }
        product.setActive(false); // soft delete keeps order history intact
        productRepository.save(product);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getMyProducts(String sellerEmail, Pageable pageable) {
        Seller seller = requireSeller(sellerEmail);
        Page<Product> page = productRepository.findBySellerId(seller.getId(), pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    private Seller requireSeller(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return sellerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getBrands(String categorySlug, Long categoryId) {
        List<Long> categoryIds = categoryService.resolveCategoryIds(categorySlug, categoryId);
        List<Object[]> rows;
        if (categoryIds == null || categoryIds.isEmpty()) {
            rows = productRepository.findAllBrandsWithCount();
        } else {
            rows = productRepository.findBrandsWithCountByCategoryIds(categoryIds);
        }
        return rows.stream()
                .map(r -> (String) r[0])
                .filter(b -> b != null && !b.isBlank() && b.length() > 1)
                .toList();
    }

    private Seller requireApprovedSeller(String email) {
        Seller seller = requireSeller(email);
        if (seller.getStatus() != SellerStatus.APPROVED) {
            throw new ForbiddenException("Your seller account must be approved before you can manage products");
        }
        return seller;
    }

    private ProductResponse toResponse(Product p) {
        BigDecimal discount = p.getDiscountPercent() == null ? BigDecimal.ZERO : p.getDiscountPercent();
        BigDecimal effectivePrice = p.getPrice()
                .multiply(BigDecimal.ONE.subtract(discount.divide(BigDecimal.valueOf(100))))
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
                .categorySlug(p.getCategory() != null ? p.getCategory().getSlug() : null)
                .sellerName(p.getSeller() != null ? p.getSeller().getBusinessName() : null)
                .sellerId(p.getSeller() != null ? p.getSeller().getId() : null)
                .stockQuantity(stock)
                .inStock(stock != null && stock > 0)
                .images(images)
                .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null)
                .build();
    }
}

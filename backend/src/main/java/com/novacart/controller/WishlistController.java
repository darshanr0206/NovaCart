package com.novacart.controller;

import com.novacart.dto.response.WishlistItemResponse;
import com.novacart.entity.*;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<WishlistItemResponse>> get(Authentication auth) {
        Wishlist wishlist = getOrCreate(auth.getName());
        return ResponseEntity.ok(wishlist.getItems().stream().map(this::toResponse).toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<List<WishlistItemResponse>> add(Authentication auth, @RequestBody Map<String, Long> body) {
        Wishlist wishlist = getOrCreate(auth.getName());
        Long productId = body.get("productId");

        boolean alreadyIn = wishlistItemRepository.findByWishlistIdAndProductId(wishlist.getId(), productId).isPresent();
        if (!alreadyIn) {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            WishlistItem item = WishlistItem.builder().wishlist(wishlist).product(product).build();
            wishlist.getItems().add(item);
            wishlistItemRepository.save(item);
        }
        return ResponseEntity.ok(wishlist.getItems().stream().map(this::toResponse).toList());
    }

    @DeleteMapping("/{productId}")
    @Transactional
    public ResponseEntity<Void> remove(Authentication auth, @PathVariable Long productId) {
        Wishlist wishlist = getOrCreate(auth.getName());
        wishlistItemRepository.findByWishlistIdAndProductId(wishlist.getId(), productId)
                .ifPresent(item -> {
                    wishlist.getItems().remove(item);
                    wishlistItemRepository.delete(item);
                });
        return ResponseEntity.noContent().build();
    }

    private Wishlist getOrCreate(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return wishlistRepository.findByUserId(user.getId())
                .orElseGet(() -> wishlistRepository.save(Wishlist.builder().user(user).items(new java.util.ArrayList<>()).build()));
    }

    private WishlistItemResponse toResponse(WishlistItem item) {
        Product p = item.getProduct();
        BigDecimal discount = p.getDiscountPercent() == null ? BigDecimal.ZERO : p.getDiscountPercent();
        BigDecimal effectivePrice = p.getPrice()
                .multiply(BigDecimal.ONE.subtract(discount.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);

        List<WishlistItemResponse.ImageSummary> imgs = p.getImages() == null ? List.of() :
                p.getImages().stream().map(img -> WishlistItemResponse.ImageSummary.builder().url(img.getUrl()).build()).toList();

        return WishlistItemResponse.builder()
                .id(item.getId())
                .product(WishlistItemResponse.WishlistProductSummary.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .price(p.getPrice())
                        .discountPercent(discount)
                        .effectivePrice(effectivePrice)
                        .averageRating(p.getAverageRating())
                        .reviewCount(p.getReviewCount())
                        .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                        .images(imgs)
                        .build())
                .build();
    }
}

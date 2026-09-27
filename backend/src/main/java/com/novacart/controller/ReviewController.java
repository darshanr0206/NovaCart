package com.novacart.controller;

import com.novacart.dto.request.ReviewRequest;
import com.novacart.entity.Product;
import com.novacart.entity.Review;
import com.novacart.entity.User;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.ProductRepository;
import com.novacart.repository.ReviewRepository;
import com.novacart.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<Review>> getReviews(@PathVariable Long productId,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewRepository.findByProductId(productId, PageRequest.of(page, size)));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Review> addOrUpdateReview(Authentication auth, @PathVariable Long productId,
                                                      @Valid @RequestBody ReviewRequest request) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Review review = reviewRepository.findByProductIdAndUserId(productId, user.getId())
                .orElse(Review.builder().product(product).user(user).build());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setImageUrl(request.getImageUrl());
        review = reviewRepository.save(review);

        recalculateRating(product);
        return ResponseEntity.ok(review);
    }

    @DeleteMapping("/{reviewId}")
    @Transactional
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long productId, @PathVariable Long reviewId) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        if (!review.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Review not found");
        }
        Product product = review.getProduct();
        reviewRepository.delete(review);
        recalculateRating(product);
        return ResponseEntity.noContent().build();
    }

    private void recalculateRating(Product product) {
        var all = reviewRepository.findByProductId(product.getId(), PageRequest.of(0, Integer.MAX_VALUE - 1));
        double avg = all.getContent().stream().mapToInt(Review::getRating).average().orElse(0.0);
        product.setAverageRating(Math.round(avg * 10.0) / 10.0);
        product.setReviewCount((int) all.getTotalElements());
        productRepository.save(product);
    }
}

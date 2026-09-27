package com.novacart.controller;

import com.novacart.dto.response.ProductResponse;
import com.novacart.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/similar/{productId}")
    public ResponseEntity<List<ProductResponse>> getSimilarProducts(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(recommendationService.getSimilarProducts(productId, limit));
    }

    @GetMapping("/for-you")
    public ResponseEntity<List<ProductResponse>> getRecommendedForYou(
            Authentication authentication,
            @RequestParam(defaultValue = "12") int limit) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(recommendationService.getRecommendedForYou(email, limit));
    }

    @GetMapping({"/complete-look/{productId}", "/complete-the-look/{productId}"})
    public ResponseEntity<List<ProductResponse>> getCompleteTheLook(@PathVariable Long productId) {
        return ResponseEntity.ok(recommendationService.getCompleteTheLook(productId));
    }

    @GetMapping({"/frequently-bought-together/{productId}", "/bundle/{productId}"})
    public ResponseEntity<List<ProductResponse>> getFrequentlyBoughtTogether(@PathVariable Long productId) {
        return ResponseEntity.ok(recommendationService.getFrequentlyBoughtTogether(productId));
    }
}

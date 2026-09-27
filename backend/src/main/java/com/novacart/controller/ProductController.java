package com.novacart.controller;

import com.novacart.dto.request.ProductRequest;
import com.novacart.dto.response.PageResponse;
import com.novacart.dto.response.ProductResponse;
import com.novacart.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<PageResponse<ProductResponse>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String categorySlug,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Long sellerId,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String color,
            @RequestParam(value = "productSize", required = false) String productSize,
            @RequestParam(required = false) BigDecimal minDiscount,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(productService.search(
                keyword, categoryId, categorySlug, minPrice, maxPrice, sellerId,
                minRating, sortBy, brand, color, productSize, minDiscount, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/brands")
    public ResponseEntity<java.util.List<String>> getBrands(
            @RequestParam(required = false) String categorySlug,
            @RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(productService.getBrands(categorySlug, categoryId));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<java.util.List<com.novacart.dto.response.SearchSuggestionResponse>> getSuggestions(
            @RequestParam String query,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(productService.getSuggestions(query, limit));
    }

    @PostMapping("/search-by-image")
    public ResponseEntity<java.util.List<ProductResponse>> searchByImage(
            @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "imageUrl", required = false) String imageUrl) {
        return ResponseEntity.ok(productService.searchByImage(file, imageUrl));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> create(Authentication auth, @Valid @RequestBody ProductRequest request) {
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(productService.create(auth.getName(), isAdmin, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> update(Authentication auth, @PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(productService.update(auth.getName(), isAdmin, id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        productService.delete(auth.getName(), isAdmin, id);
        return ResponseEntity.noContent().build();
    }
}

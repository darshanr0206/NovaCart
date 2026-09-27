package com.novacart.controller;

import com.novacart.dto.request.ProductRequest;
import com.novacart.dto.request.SellerRegisterRequest;
import com.novacart.dto.response.PageResponse;
import com.novacart.dto.response.ProductResponse;
import com.novacart.dto.response.SellerResponse;
import com.novacart.entity.SellerStatus;
import com.novacart.service.ProductService;
import com.novacart.service.SellerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class SellerController {

    private final SellerService sellerService;
    private final ProductService productService;

    // Public: register to become a seller (any authenticated customer)
    @PostMapping("/api/sellers/register")
    public ResponseEntity<SellerResponse> register(Authentication auth, @Valid @RequestBody SellerRegisterRequest request) {
        return ResponseEntity.ok(sellerService.register(auth.getName(), request));
    }

    @GetMapping("/api/sellers")
    public ResponseEntity<PageResponse<SellerResponse>> getAll(
            @RequestParam(required = false) SellerStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(sellerService.getAll(status, PageRequest.of(page, size)));
    }

    @GetMapping("/api/sellers/{id}")
    public ResponseEntity<SellerResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(sellerService.getById(id));
    }

    // Seller-only dashboard endpoints
    @GetMapping("/api/seller/me")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerResponse> myProfile(Authentication auth) {
        return ResponseEntity.ok(sellerService.getMyProfile(auth.getName()));
    }

    @GetMapping("/api/seller/products")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<PageResponse<ProductResponse>> myProducts(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(productService.getMyProducts(auth.getName(), PageRequest.of(page, size)));
    }
}

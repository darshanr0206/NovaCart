package com.novacart.controller;

import com.novacart.dto.request.CouponRequest;
import com.novacart.dto.response.CouponResponse;
import com.novacart.dto.response.CouponValidateResponse;
import com.novacart.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    // ─── Customer Endpoints ───────────────────────────────────────────────────

    @GetMapping("/api/coupons/validate")
    public ResponseEntity<CouponValidateResponse> validateCouponGet(
            @RequestParam String code,
            @RequestParam(defaultValue = "0") BigDecimal amount) {
        return ResponseEntity.ok(couponService.validateCoupon(code, amount));
    }

    @PostMapping("/api/coupons/validate")
    public ResponseEntity<CouponValidateResponse> validateCouponPost(@RequestBody Map<String, Object> body) {
        String code = (String) body.get("code");
        BigDecimal amount = BigDecimal.ZERO;
        if (body.get("amount") != null) {
            try {
                amount = new BigDecimal(body.get("amount").toString());
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(couponService.validateCoupon(code, amount));
    }

    // ─── Admin Endpoints ──────────────────────────────────────────────────────

    @GetMapping("/api/admin/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CouponResponse>> getAllCoupons() {
        return ResponseEntity.ok(couponService.getAllCoupons());
    }

    @GetMapping("/api/admin/coupons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> getCoupon(@PathVariable Long id) {
        return ResponseEntity.ok(couponService.getCoupon(id));
    }

    @PostMapping("/api/admin/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> createCoupon(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.ok(couponService.createCoupon(request));
    }

    @PutMapping("/api/admin/coupons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> updateCoupon(
            @PathVariable Long id,
            @Valid @RequestBody CouponRequest request) {
        return ResponseEntity.ok(couponService.updateCoupon(id, request));
    }

    @DeleteMapping("/api/admin/coupons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(Map.of("message", "Coupon deleted successfully"));
    }
}

package com.novacart.controller;

import com.novacart.dto.request.CouponValidateRequest;
import com.novacart.dto.response.CouponResponse;
import com.novacart.dto.response.CouponValidateResponse;
import com.novacart.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/active")
    public ResponseEntity<List<CouponResponse>> getActiveCoupons() {
        return ResponseEntity.ok(couponService.getActivePublicCoupons());
    }

    @PostMapping("/validate")
    public ResponseEntity<CouponValidateResponse> validateCoupon(@Valid @RequestBody CouponValidateRequest request) {
        return ResponseEntity.ok(couponService.validateCoupon(request));
    }

    @GetMapping("/validate")
    public ResponseEntity<CouponValidateResponse> validateCouponGet(
            @RequestParam String code,
            @RequestParam(defaultValue = "0") BigDecimal amount) {
        return ResponseEntity.ok(couponService.validateCoupon(
                CouponValidateRequest.builder().code(code).amount(amount).build()));
    }
}

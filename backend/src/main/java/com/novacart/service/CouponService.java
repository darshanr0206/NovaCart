package com.novacart.service;

import com.novacart.dto.request.CouponCreateRequest;
import com.novacart.dto.request.CouponUpdateRequest;
import com.novacart.dto.request.CouponValidateRequest;
import com.novacart.dto.response.CouponResponse;
import com.novacart.dto.response.CouponValidateResponse;
import com.novacart.entity.Coupon;

import java.math.BigDecimal;
import java.util.List;

public interface CouponService {
    List<CouponResponse> getAllCoupons();
    List<CouponResponse> getActivePublicCoupons();
    CouponResponse getCouponById(Long id);
    CouponResponse createCoupon(CouponCreateRequest request);
    CouponResponse updateCoupon(Long id, CouponUpdateRequest request);
    void deleteCoupon(Long id);
    CouponResponse toggleStatus(Long id);
    CouponValidateResponse validateCoupon(CouponValidateRequest request);
    BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal);
    void recordCouponUsage(String code);
    CouponResponse toResponse(Coupon coupon);
}

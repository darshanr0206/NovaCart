package com.novacart.service;

import com.novacart.dto.request.CouponRequest;
import com.novacart.dto.response.CouponResponse;
import com.novacart.dto.response.CouponValidateResponse;
import com.novacart.entity.Coupon;

import java.math.BigDecimal;
import java.util.List;

public interface CouponService {
    CouponResponse createCoupon(CouponRequest request);
    CouponResponse updateCoupon(Long id, CouponRequest request);
    void deleteCoupon(Long id);
    List<CouponResponse> getAllCoupons();
    CouponResponse getCoupon(Long id);
    CouponValidateResponse validateCoupon(String code, BigDecimal cartTotal);
    CouponResponse toResponse(Coupon coupon);
}

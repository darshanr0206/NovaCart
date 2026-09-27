package com.novacart.service.impl;

import com.novacart.dto.request.CouponRequest;
import com.novacart.dto.response.CouponResponse;
import com.novacart.dto.response.CouponValidateResponse;
import com.novacart.entity.Coupon;
import com.novacart.exception.BadRequestException;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.CouponRepository;
import com.novacart.service.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    @Override
    @Transactional
    public CouponResponse createCoupon(CouponRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();
        if (couponRepository.findByCodeIgnoreCase(cleanCode).isPresent()) {
            throw new BadRequestException("Coupon code already exists: " + cleanCode);
        }

        Coupon coupon = Coupon.builder()
                .code(cleanCode)
                .discountType(request.getDiscountType() != null ? request.getDiscountType() : Coupon.DiscountType.PERCENTAGE)
                .discountPercent(request.getDiscountPercent() != null ? request.getDiscountPercent() : BigDecimal.ZERO)
                .fixedDiscountAmount(request.getFixedDiscountAmount())
                .minOrderValue(request.getMinOrderValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .usageLimit(request.getUsageLimit())
                .usageCount(0)
                .expiryDate(request.getExpiryDate())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Coupon saved = couponRepository.save(coupon);
        log.info("Created coupon #{}: {}", saved.getId(), saved.getCode());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));

        String cleanCode = request.getCode().trim().toUpperCase();
        if (!coupon.getCode().equalsIgnoreCase(cleanCode)) {
            if (couponRepository.findByCodeIgnoreCase(cleanCode).isPresent()) {
                throw new BadRequestException("Coupon code already exists: " + cleanCode);
            }
            coupon.setCode(cleanCode);
        }

        if (request.getDiscountType() != null) coupon.setDiscountType(request.getDiscountType());
        if (request.getDiscountPercent() != null) coupon.setDiscountPercent(request.getDiscountPercent());
        coupon.setFixedDiscountAmount(request.getFixedDiscountAmount());
        coupon.setMinOrderValue(request.getMinOrderValue());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setUsageLimit(request.getUsageLimit());
        if (request.getExpiryDate() != null) coupon.setExpiryDate(request.getExpiryDate());
        if (request.getActive() != null) coupon.setActive(request.getActive());

        Coupon updated = couponRepository.save(coupon);
        log.info("Updated coupon #{}: {}", updated.getId(), updated.getCode());
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
        couponRepository.delete(coupon);
        log.info("Deleted coupon #{}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponResponse> getAllCoupons() {
        return couponRepository.findAllByOrderByExpiryDateDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse getCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
        return toResponse(coupon);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponValidateResponse validateCoupon(String code, BigDecimal cartTotal) {
        if (code == null || code.isBlank()) {
            return CouponValidateResponse.builder()
                    .valid(false)
                    .message("Coupon code cannot be empty")
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        String cleanCode = code.trim().toUpperCase();
        var opt = couponRepository.findByCodeAndActiveTrue(cleanCode);
        if (opt.isEmpty()) {
            return CouponValidateResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Invalid or inactive coupon code")
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        Coupon coupon = opt.get();
        if (coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            return CouponValidateResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("This coupon has expired")
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        if (coupon.getMinOrderValue() != null && cartTotal.compareTo(coupon.getMinOrderValue()) < 0) {
            return CouponValidateResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Minimum order of ₹" + coupon.getMinOrderValue() + " required to use this coupon")
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        if (coupon.getUsageLimit() != null && coupon.getUsageCount() != null && coupon.getUsageCount() >= coupon.getUsageLimit()) {
            return CouponValidateResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("This coupon has reached its maximum usage limit")
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }

        BigDecimal discount = BigDecimal.ZERO;
        if (coupon.getDiscountType() == Coupon.DiscountType.FIXED) {
            discount = coupon.getFixedDiscountAmount() != null ? coupon.getFixedDiscountAmount() : BigDecimal.ZERO;
        } else {
            discount = cartTotal.multiply(coupon.getDiscountPercent().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))
                    .setScale(2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscountAmount() != null && discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discount = coupon.getMaxDiscountAmount();
            }
        }

        if (discount.compareTo(cartTotal) > 0) {
            discount = cartTotal;
        }

        return CouponValidateResponse.builder()
                .valid(true)
                .code(cleanCode)
                .discountAmount(discount)
                .message("Coupon applied successfully! You save ₹" + discount)
                .build();
    }

    @Override
    public CouponResponse toResponse(Coupon coupon) {
        if (coupon == null) return null;
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType())
                .discountPercent(coupon.getDiscountPercent())
                .fixedDiscountAmount(coupon.getFixedDiscountAmount())
                .minOrderValue(coupon.getMinOrderValue())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .usageLimit(coupon.getUsageLimit())
                .usageCount(coupon.getUsageCount() != null ? coupon.getUsageCount() : 0)
                .expiryDate(coupon.getExpiryDate())
                .active(coupon.isActive())
                .build();
    }
}

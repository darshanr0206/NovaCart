package com.novacart.service.impl;

import com.novacart.dto.request.CouponCreateRequest;
import com.novacart.dto.request.CouponUpdateRequest;
import com.novacart.dto.request.CouponValidateRequest;
import com.novacart.dto.response.CouponResponse;
import com.novacart.dto.response.CouponValidateResponse;
import com.novacart.entity.Coupon;
import com.novacart.entity.DiscountType;
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
    @Transactional(readOnly = true)
    public List<CouponResponse> getAllCoupons() {
        return couponRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponResponse> getActivePublicCoupons() {
        return couponRepository.findByActiveTrueAndExpiryDateAfterOrderByCreatedAtDesc(LocalDateTime.now()).stream()
                .filter(c -> c.getUsageLimit() == null || c.getUsedCount() < c.getUsageLimit())
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse getCouponById(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
        return toResponse(coupon);
    }

    @Override
    @Transactional
    public CouponResponse createCoupon(CouponCreateRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();
        if (couponRepository.existsByCodeIgnoreCase(cleanCode)) {
            throw new BadRequestException("Coupon code '" + cleanCode + "' already exists");
        }

        if (request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Discount value must be greater than 0");
        }

        if (request.getDiscountType() == DiscountType.PERCENTAGE && request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("Percentage discount cannot exceed 100%");
        }

        Coupon coupon = Coupon.builder()
                .code(cleanCode)
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .discountPercent(request.getDiscountType() == DiscountType.PERCENTAGE ? request.getDiscountValue() : null)
                .minOrderValue(request.getMinOrderValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .expiryDate(request.getExpiryDate())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .active(request.isActive())
                .build();

        Coupon saved = couponRepository.save(coupon);
        log.info("Created coupon {} with type {} and value {}", saved.getCode(), saved.getDiscountType(), saved.getDiscountValue());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CouponResponse updateCoupon(Long id, CouponUpdateRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));

        if (request.getCode() != null && !request.getCode().isBlank()) {
            String cleanCode = request.getCode().trim().toUpperCase();
            if (!cleanCode.equalsIgnoreCase(coupon.getCode()) && couponRepository.existsByCodeIgnoreCase(cleanCode)) {
                throw new BadRequestException("Coupon code '" + cleanCode + "' already exists");
            }
            coupon.setCode(cleanCode);
        }

        if (request.getDiscountType() != null) {
            coupon.setDiscountType(request.getDiscountType());
        }

        if (request.getDiscountValue() != null) {
            if (request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Discount value must be greater than 0");
            }
            if (coupon.getDiscountType() == DiscountType.PERCENTAGE && request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BadRequestException("Percentage discount cannot exceed 100%");
            }
            coupon.setDiscountValue(request.getDiscountValue());
            if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
                coupon.setDiscountPercent(request.getDiscountValue());
            }
        }

        if (request.getMinOrderValue() != null) {
            coupon.setMinOrderValue(request.getMinOrderValue());
        }

        if (request.getMaxDiscountAmount() != null) {
            coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        }

        if (request.getExpiryDate() != null) {
            coupon.setExpiryDate(request.getExpiryDate());
        }

        if (request.getUsageLimit() != null) {
            coupon.setUsageLimit(request.getUsageLimit());
        }

        if (request.getActive() != null) {
            coupon.setActive(request.getActive());
        }

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
        log.info("Deleted coupon #{}: {}", id, coupon.getCode());
    }

    @Override
    @Transactional
    public CouponResponse toggleStatus(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
        coupon.setActive(!coupon.isActive());
        Coupon updated = couponRepository.save(coupon);
        log.info("Toggled coupon #{} active status to {}", id, updated.isActive());
        return toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponValidateResponse validateCoupon(CouponValidateRequest request) {
        String cleanCode = request.getCode() != null ? request.getCode().trim().toUpperCase() : "";
        BigDecimal amount = request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO;

        Coupon coupon = couponRepository.findByCodeIgnoreCase(cleanCode)
                .orElse(null);

        if (coupon == null) {
            return CouponValidateResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Invalid coupon code")
                    .build();
        }

        if (!coupon.isActive()) {
            return CouponValidateResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("This coupon is no longer active")
                    .build();
        }

        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            return CouponValidateResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("This coupon has expired")
                    .build();
        }

        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            return CouponValidateResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("This coupon has reached its maximum usage limit")
                    .build();
        }

        if (coupon.getMinOrderValue() != null && amount.compareTo(coupon.getMinOrderValue()) < 0) {
            return CouponValidateResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Minimum order value of ₹" + coupon.getMinOrderValue().toPlainString() + " required for this coupon")
                    .build();
        }

        BigDecimal discountAmount = calculateDiscount(coupon, amount);
        BigDecimal finalTotal = amount.subtract(discountAmount).max(BigDecimal.ZERO);

        return CouponValidateResponse.builder()
                .valid(true)
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue() != null ? coupon.getDiscountValue() : coupon.getDiscountPercent())
                .discountAmount(discountAmount)
                .finalTotal(finalTotal)
                .message("Coupon applied! You saved ₹" + discountAmount.toPlainString())
                .build();
    }

    @Override
    public BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        if (coupon == null || subtotal == null || subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discountValue = coupon.getDiscountValue();
        if (discountValue == null && coupon.getDiscountPercent() != null) {
            discountValue = coupon.getDiscountPercent();
        }
        if (discountValue == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal discountAmount = BigDecimal.ZERO;

        if (coupon.getDiscountType() == DiscountType.FIXED) {
            discountAmount = discountValue.min(subtotal);
        } else {
            // PERCENTAGE
            discountAmount = subtotal.multiply(discountValue.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))
                    .setScale(2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscountAmount() != null && discountAmount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discountAmount = coupon.getMaxDiscountAmount();
            }
        }

        return discountAmount.min(subtotal).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    @Transactional
    public void recordCouponUsage(String code) {
        if (code == null || code.isBlank()) return;
        couponRepository.findByCodeIgnoreCase(code.trim()).ifPresent(coupon -> {
            int currentUsed = coupon.getUsedCount() != null ? coupon.getUsedCount() : 0;
            coupon.setUsedCount(currentUsed + 1);
            couponRepository.save(coupon);
            log.info("Recorded usage for coupon {}. Total used: {}", coupon.getCode(), coupon.getUsedCount());
        });
    }

    @Override
    public CouponResponse toResponse(Coupon coupon) {
        if (coupon == null) return null;
        boolean isExpired = coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now());
        BigDecimal val = coupon.getDiscountValue() != null ? coupon.getDiscountValue() : coupon.getDiscountPercent();

        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType() != null ? coupon.getDiscountType() : DiscountType.PERCENTAGE)
                .discountValue(val)
                .discountPercent(coupon.getDiscountPercent() != null ? coupon.getDiscountPercent() : (coupon.getDiscountType() == DiscountType.PERCENTAGE ? val : null))
                .minOrderValue(coupon.getMinOrderValue())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .expiryDate(coupon.getExpiryDate() != null ? coupon.getExpiryDate().toString() : null)
                .usageLimit(coupon.getUsageLimit())
                .usedCount(coupon.getUsedCount() != null ? coupon.getUsedCount() : 0)
                .active(coupon.isActive())
                .expired(isExpired)
                .createdAt(coupon.getCreatedAt() != null ? coupon.getCreatedAt().toString() : null)
                .build();
    }
}

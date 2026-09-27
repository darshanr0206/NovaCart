package com.novacart.dto.response;

import com.novacart.entity.Coupon;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponResponse {
    private Long id;
    private String code;
    private Coupon.DiscountType discountType;
    private BigDecimal discountPercent;
    private BigDecimal fixedDiscountAmount;
    private BigDecimal minOrderValue;
    private BigDecimal maxDiscountAmount;
    private Integer usageLimit;
    private Integer usageCount;
    private LocalDateTime expiryDate;
    private boolean active;
}

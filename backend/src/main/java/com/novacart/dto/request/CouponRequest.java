package com.novacart.dto.request;

import com.novacart.entity.Coupon;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CouponRequest {
    @NotBlank(message = "Coupon code is required")
    private String code;

    @Builder.Default
    private Coupon.DiscountType discountType = Coupon.DiscountType.PERCENTAGE;

    private BigDecimal discountPercent;

    private BigDecimal fixedDiscountAmount;

    private BigDecimal minOrderValue;

    private BigDecimal maxDiscountAmount;

    private Integer usageLimit;

    @NotNull(message = "Expiry date is required")
    private LocalDateTime expiryDate;

    @Builder.Default
    private Boolean active = true;
}

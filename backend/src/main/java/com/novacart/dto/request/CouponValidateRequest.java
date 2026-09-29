package com.novacart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponValidateRequest {

    @NotBlank(message = "Coupon code is required")
    private String code;

    @NotNull(message = "Order subtotal amount is required")
    private BigDecimal amount;
}

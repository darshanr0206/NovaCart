package com.novacart.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateOrderRequest {
    @NotNull
    private Long addressId;

    private String couponCode;
    private String paymentMethod;
}

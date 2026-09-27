package com.novacart.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentVerifyRequest {
    @NotBlank private String razorpayOrderId;
    @NotBlank private String razorpayPaymentId;
    private String razorpaySignature;
    private String screenshotUrl;
    private String paymentMethod;
}

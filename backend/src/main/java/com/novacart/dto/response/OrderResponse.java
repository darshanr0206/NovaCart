package com.novacart.dto.response;

import com.novacart.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private String customerName;
    private String customerEmail;
    private String deliveryAddress;
    private OrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal deliveryCharge;
    private BigDecimal discount;
    private BigDecimal total;
    private String createdAt;
    private List<OrderItemResponse> items;
    private PaymentResponse payment;
    private String paymentStatus;
    private String paymentScreenshotUrl;
    private String paymentMethod;
    private ReturnResponse returnRequest;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PaymentResponse {
        private Long id;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String paymentMethod;
        private String screenshotUrl;
        private BigDecimal amount;
        private com.novacart.entity.PaymentStatus status;
        private String createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private String productName;
        private BigDecimal price;
        private Integer quantity;
        private OrderStatus itemStatus;
    }
}

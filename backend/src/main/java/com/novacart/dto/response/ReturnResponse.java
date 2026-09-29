package com.novacart.dto.response;

import com.novacart.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnResponse {
    private Long id;
    private Long orderId;
    private String orderNumber;
    private Long orderItemId;
    private String customer;
    private String customerEmail;
    private String product;
    private BigDecimal amount;
    private String reason;
    private String note;
    private String adminComment;
    private OrderStatus status;
    private String refundStatus;
    private BigDecimal refundAmount;
    private String refundTransactionId;
    private String refundPaymentMethod;
    private String refundedAt;
    private String paymentMethod;
    private String createdAt;
    private String updatedAt;
}

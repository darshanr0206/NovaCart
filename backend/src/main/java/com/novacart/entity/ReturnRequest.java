package com.novacart.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "return_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = true)
    private OrderItem orderItem;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReturnType type = ReturnType.RETURN;

    @Column(length = 1000)
    private String reason;

    @Column(length = 2000)
    private String note;

    @Column(length = 1000)
    private String adminComment;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OrderStatus status = OrderStatus.RETURN_REQUESTED;

    @Column(name = "refund_status")
    private String refundStatus;

    @Column(name = "refund_amount", precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_transaction_id")
    private String refundTransactionId;

    @Column(name = "refund_payment_method")
    private String refundPaymentMethod;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ReturnType { RETURN, REPLACEMENT }
}

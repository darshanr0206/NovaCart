package com.novacart.entity;

import jakarta.persistence.*;
import lombok.*;
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

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ReturnType { RETURN, REPLACEMENT }
}

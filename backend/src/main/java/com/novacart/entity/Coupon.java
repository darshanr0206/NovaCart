package com.novacart.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(precision = 12, scale = 2)
    private BigDecimal minOrderValue;

    @Column(precision = 12, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Builder.Default
    private boolean active = true;
}

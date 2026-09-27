package com.novacart.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inventory")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer lowStockThreshold = 5;

    public boolean isLowStock() {
        return stockQuantity != null && stockQuantity <= lowStockThreshold;
    }

    public boolean isOutOfStock() {
        return stockQuantity == null || stockQuantity <= 0;
    }
}

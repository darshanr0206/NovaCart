package com.novacart.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sellers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Seller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String businessName;

    @Column(nullable = false)
    private String businessEmail;

    private String businessPhone;

    @Column(length = 1000)
    private String businessAddress;

    @Column(length = 2000)
    private String businessInfo;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SellerStatus status = SellerStatus.PENDING;

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
}

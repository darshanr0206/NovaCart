package com.novacart.repository;

import com.novacart.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCode(String code);
    Optional<Coupon> findByCodeIgnoreCase(String code);
    Optional<Coupon> findByCodeAndActiveTrue(String code);
    Optional<Coupon> findByCodeIgnoreCaseAndActiveTrue(String code);
    List<Coupon> findAllByOrderByCreatedAtDesc();
    List<Coupon> findByActiveTrueAndExpiryDateAfterOrderByCreatedAtDesc(LocalDateTime now);
    boolean existsByCodeIgnoreCase(String code);
}

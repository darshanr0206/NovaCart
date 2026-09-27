package com.novacart.repository;

import com.novacart.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeAndActiveTrue(String code);
    Optional<Coupon> findByCodeIgnoreCase(String code);
    List<Coupon> findAllByOrderByExpiryDateDesc();
}

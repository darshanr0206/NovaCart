package com.novacart.repository;

import com.novacart.entity.Seller;
import com.novacart.entity.SellerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SellerRepository extends JpaRepository<Seller, Long> {
    Optional<Seller> findByUserId(Long userId);
    Page<Seller> findByStatus(SellerStatus status, Pageable pageable);
}

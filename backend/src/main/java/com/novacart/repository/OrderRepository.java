package com.novacart.repository;

import com.novacart.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    Page<Order> findByUserId(Long userId, Pageable pageable);
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<Order> findByIdAndUserId(Long id, Long userId);
    Optional<Order> findByOrderNumber(String orderNumber);
    Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);
    long countByStatus(com.novacart.entity.OrderStatus status);
}


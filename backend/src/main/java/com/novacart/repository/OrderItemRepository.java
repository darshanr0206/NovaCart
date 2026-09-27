package com.novacart.repository;

import com.novacart.entity.OrderItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    Page<OrderItem> findBySellerId(Long sellerId, Pageable pageable);
}

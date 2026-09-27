package com.novacart.repository;

import com.novacart.entity.OrderStatus;
import com.novacart.entity.ReturnRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    List<ReturnRequest> findByOrderId(Long orderId);
    Optional<ReturnRequest> findFirstByOrderIdOrderByCreatedAtDesc(Long orderId);
    List<ReturnRequest> findByOrderUserIdOrderByCreatedAtDesc(Long userId);
    Page<ReturnRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<ReturnRequest> findAllByOrderByCreatedAtDesc();
    boolean existsByOrderIdAndStatus(Long orderId, OrderStatus status);
}

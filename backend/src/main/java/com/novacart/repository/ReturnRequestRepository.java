package com.novacart.repository;

import com.novacart.entity.OrderStatus;
import com.novacart.entity.ReturnRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    List<ReturnRequest> findByOrderId(Long orderId);
    Optional<ReturnRequest> findFirstByOrderIdOrderByCreatedAtDesc(Long orderId);

    @Query("SELECT r FROM ReturnRequest r WHERE r.order.user.id = :userId ORDER BY r.createdAt DESC")
    List<ReturnRequest> findByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM ReturnRequest r ORDER BY r.createdAt DESC")
    List<ReturnRequest> findAllOrderByCreatedAtDesc();

    @Query("SELECT r FROM ReturnRequest r ORDER BY r.createdAt DESC")
    Page<ReturnRequest> findAllPaged(Pageable pageable);

    boolean existsByOrderIdAndStatus(Long orderId, OrderStatus status);
}

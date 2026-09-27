package com.novacart.repository;

import com.novacart.entity.Delivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Page<Delivery> findByDeliveryPartnerId(Long partnerId, Pageable pageable);
}

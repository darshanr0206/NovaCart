package com.novacart.controller;

import com.novacart.entity.Delivery;
import com.novacart.entity.DeliveryStatus;
import com.novacart.entity.User;
import com.novacart.exception.ForbiddenException;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.DeliveryRepository;
import com.novacart.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/delivery")
@PreAuthorize("hasRole('DELIVERY_PARTNER')")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;

    @GetMapping("/orders")
    public ResponseEntity<Page<Delivery>> myDeliveries(Authentication auth,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "20") int size) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(deliveryRepository.findByDeliveryPartnerId(user.getId(), PageRequest.of(page, size)));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Delivery> updateStatus(Authentication auth, @PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found"));

        if (delivery.getDeliveryPartner() == null || !delivery.getDeliveryPartner().getId().equals(user.getId())) {
            throw new ForbiddenException("This delivery is not assigned to you");
        }

        delivery.setStatus(DeliveryStatus.valueOf(body.get("status")));
        return ResponseEntity.ok(deliveryRepository.save(delivery));
    }
}

package com.novacart.controller;

import com.novacart.dto.request.CreateOrderRequest;
import com.novacart.dto.request.OrderStatusUpdateRequest;
import com.novacart.dto.response.OrderResponse;
import com.novacart.dto.response.PageResponse;
import com.novacart.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> create(Authentication auth, @Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(auth.getName(), request));
    }

    @GetMapping
    public ResponseEntity<PageResponse<OrderResponse>> getMyOrders(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(orderService.getMyOrders(auth.getName(), PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderByIdentifier(auth.getName(), id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancel(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(auth.getName(), id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN','DELIVERY_PARTNER')")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody OrderStatusUpdateRequest request) {
        return ResponseEntity.ok(orderService.updateStatus(id, request.getStatus()));
    }
}

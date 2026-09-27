package com.novacart.controller;

import com.novacart.dto.request.OrderStatusUpdateRequest;
import com.novacart.dto.response.OrderResponse;
import com.novacart.dto.response.PageResponse;
import com.novacart.dto.response.SellerResponse;
import com.novacart.entity.OrderStatus;
import com.novacart.entity.*;
import com.novacart.repository.*;
import com.novacart.service.OrderService;
import com.novacart.service.SellerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final SellerService sellerService;
    private final OrderService orderService;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final DeliveryRepository deliveryRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        long totalOrders = orderRepository.count();
        long newOrders = orderRepository.countByStatus(OrderStatus.PLACED);
        long totalCustomers = userRepository.count();
        long totalProducts = productRepository.count();

        Map<String, Object> stats = Map.of(
                "totalOrders", totalOrders,
                "newOrders", newOrders,
                "newCustomers", totalCustomers,
                "totalCustomers", totalCustomers,
                "totalProducts", totalProducts,
                "pendingSellerApprovals", sellerService.getAll(SellerStatus.PENDING, PageRequest.of(0, 1)).getTotalElements(),
                "pendingReturns", returnRequestRepository.count(),
                "activeDeliveries", deliveryRepository.count()
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/sellers")
    public ResponseEntity<PageResponse<SellerResponse>> sellers(
            @RequestParam(required = false) SellerStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(sellerService.getAll(status, PageRequest.of(page, size)));
    }

    @PutMapping("/sellers/{id}/approve")
    public ResponseEntity<SellerResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(sellerService.updateStatus(id, SellerStatus.APPROVED));
    }

    @PutMapping("/sellers/{id}/reject")
    public ResponseEntity<SellerResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(sellerService.updateStatus(id, SellerStatus.REJECTED));
    }

    @PutMapping("/sellers/{id}/suspend")
    public ResponseEntity<SellerResponse> suspend(@PathVariable Long id) {
        return ResponseEntity.ok(sellerService.updateStatus(id, SellerStatus.SUSPENDED));
    }

    @GetMapping("/orders")
    public ResponseEntity<PageResponse<OrderResponse>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search) {

        Specification<Order> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (paymentStatus != null && !paymentStatus.isBlank() && !paymentStatus.equalsIgnoreCase("ALL")) {
                String normalizedStatus = paymentStatus.trim().toUpperCase();
                if ("UNPAID".equals(normalizedStatus)) {
                    normalizedStatus = "PENDING";
                }

                try {
                    PaymentStatus ps = PaymentStatus.valueOf(normalizedStatus);
                    jakarta.persistence.criteria.Join<Order, Payment> paymentJoin = root.join("payment", jakarta.persistence.criteria.JoinType.LEFT);

                    jakarta.persistence.criteria.Predicate directPaymentMatch = cb.equal(paymentJoin.get("status"), ps);

                    jakarta.persistence.criteria.Predicate fallbackMatch;
                    if (ps == PaymentStatus.SUCCESS) {
                        fallbackMatch = cb.and(cb.isNull(paymentJoin.get("id")), cb.equal(root.get("status"), OrderStatus.DELIVERED));
                    } else if (ps == PaymentStatus.PENDING) {
                        fallbackMatch = cb.and(
                                cb.isNull(paymentJoin.get("id")),
                                cb.notEqual(root.get("status"), OrderStatus.DELIVERED),
                                cb.notEqual(root.get("status"), OrderStatus.CANCELLED)
                        );
                    } else if (ps == PaymentStatus.FAILED) {
                        fallbackMatch = cb.and(cb.isNull(paymentJoin.get("id")), cb.equal(root.get("status"), OrderStatus.CANCELLED));
                    } else {
                        fallbackMatch = cb.disjunction();
                    }

                    predicates.add(cb.or(directPaymentMatch, fallbackMatch));
                } catch (IllegalArgumentException ignored) {}
            }

            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                jakarta.persistence.criteria.Join<Order, User> userJoin = root.join("user", jakarta.persistence.criteria.JoinType.LEFT);

                jakarta.persistence.criteria.Predicate orderNumPredicate = cb.like(cb.lower(root.get("orderNumber")), searchPattern);
                jakarta.persistence.criteria.Predicate namePredicate = cb.like(cb.lower(userJoin.get("fullName")), searchPattern);
                jakarta.persistence.criteria.Predicate emailPredicate = cb.like(cb.lower(userJoin.get("email")), searchPattern);

                jakarta.persistence.criteria.Predicate idPredicate = cb.disjunction();
                try {
                    String cleanId = search.trim().replace("#", "").replace("NC", "");
                    if (!cleanId.isEmpty() && cleanId.matches("\\d+")) {
                        idPredicate = cb.equal(root.get("id"), Long.parseLong(cleanId));
                    }
                } catch (Exception ignored) {}

                predicates.add(cb.or(orderNumPredicate, namePredicate, emailPredicate, idPredicate));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        org.springframework.data.domain.Page<Order> ordersPage = orderRepository.findAll(
                spec,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        java.util.List<OrderResponse> dtos = ordersPage.getContent().stream()
                .map(orderService::toResponse)
                .toList();
        return ResponseEntity.ok(new PageResponse<>(dtos, ordersPage.getNumber(), ordersPage.getSize(), ordersPage.getTotalElements(), ordersPage.getTotalPages(), ordersPage.isLast()));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        return ResponseEntity.ok(orderService.updateStatus(id, request.getStatus()));
    }
}

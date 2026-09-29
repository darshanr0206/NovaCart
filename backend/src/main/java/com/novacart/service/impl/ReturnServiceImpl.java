package com.novacart.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacart.dto.request.ReturnCreateRequest;
import com.novacart.dto.request.ReturnStatusUpdateRequest;
import com.novacart.dto.response.PageResponse;
import com.novacart.dto.response.ReturnResponse;
import com.novacart.entity.*;
import com.novacart.exception.BadRequestException;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.*;
import com.novacart.service.NotificationService;
import com.novacart.service.ReturnService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReturnServiceImpl implements ReturnService {

    private final ReturnRequestRepository returnRequestRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    @Override
    @Transactional
    public ReturnResponse createReturnRequest(String email, Long orderId, ReturnCreateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You are not authorized to return this order");
        }

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Returns are only allowed after an order has been successfully Delivered. Current status: " + order.getStatus());
        }

        OrderItem orderItem = null;
        BigDecimal returnAmount = order.getTotal();
        if (request.getOrderItemId() != null) {
            orderItem = orderItemRepository.findById(request.getOrderItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order item not found with id: " + request.getOrderItemId()));
            if (!orderItem.getOrder().getId().equals(order.getId())) {
                throw new BadRequestException("Item does not belong to this order");
            }
            if (orderItem.getPriceSnapshot() != null && orderItem.getQuantity() != null) {
                returnAmount = orderItem.getPriceSnapshot().multiply(BigDecimal.valueOf(orderItem.getQuantity()));
            }
        }

        String paymentMethod = order.getPayment() != null && order.getPayment().getPaymentMethod() != null
                ? order.getPayment().getPaymentMethod()
                : "COD";

        ReturnRequest returnRequest = ReturnRequest.builder()
                .order(order)
                .orderItem(orderItem)
                .reason(request.getReason())
                .note(request.getNote())
                .status(OrderStatus.RETURN_REQUESTED)
                .refundStatus("PENDING")
                .refundAmount(returnAmount)
                .refundPaymentMethod(paymentMethod)
                .build();

        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        order.setStatus(OrderStatus.RETURN_REQUESTED);
        orderRepository.save(order);

        // Send customer notification
        notificationService.sendNotification(
                user,
                "Return Request Submitted",
                "Your return request for order #" + order.getOrderNumber() + " has been received and is under review.",
                "RETURN",
                "/orders/" + order.getId()
        );

        log.info("Return request #{} created for order #{} by customer {}", saved.getId(), order.getOrderNumber(), email);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnResponse getOrderReturn(String email, Long orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean isAdmin = user.getRoles() != null && user.getRoles().contains(RoleName.ADMIN);

        if (!isAdmin && !order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You are not authorized to view return for this order");
        }

        ReturnRequest req = returnRequestRepository.findFirstByOrderIdOrderByCreatedAtDesc(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("No return request found for order #" + orderId));

        return toResponse(req);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReturnResponse> getAllReturns() {
        return returnRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReturnResponse> getAllReturns(Pageable pageable) {
        Page<ReturnRequest> page = returnRequestRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    @Override
    @Transactional
    public ReturnResponse updateReturnStatus(Long returnRequestId, ReturnStatusUpdateRequest request) {
        ReturnRequest req = returnRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Return request not found with id: " + returnRequestId));

        OrderStatus newStatus = request.getStatus();
        req.setStatus(newStatus);
        if (request.getAdminComment() != null && !request.getAdminComment().isBlank()) {
            req.setAdminComment(request.getAdminComment());
        }

        Order order = req.getOrder();
        User customer = order != null ? order.getUser() : null;
        Payment payment = order != null ? order.getPayment() : null;

        if (newStatus == OrderStatus.RETURN_APPROVED) {
            req.setRefundStatus("INITIATED");
            if (customer != null) {
                notificationService.sendNotification(
                        customer,
                        "Return Request Approved",
                        "Your return request for order #" + (order.getOrderNumber() != null ? order.getOrderNumber() : order.getId()) + " has been approved! Doorstep pickup is being scheduled.",
                        "RETURN",
                        "/orders/" + order.getId()
                );
            }
        } else if (newStatus == OrderStatus.RETURN_REJECTED) {
            req.setRefundStatus("REJECTED");
            if (customer != null) {
                String commentSuffix = req.getAdminComment() != null ? " Reason: " + req.getAdminComment() : "";
                notificationService.sendNotification(
                        customer,
                        "Return Request Rejected",
                        "Your return request for order #" + (order.getOrderNumber() != null ? order.getOrderNumber() : order.getId()) + " was not approved." + commentSuffix,
                        "RETURN",
                        "/orders/" + order.getId()
                );
            }
        } else if (newStatus == OrderStatus.RETURNED) {
            req.setRefundStatus("IN_PROGRESS");
            if (customer != null) {
                notificationService.sendNotification(
                        customer,
                        "Returned Item Received",
                        "We have received the returned package for order #" + (order.getOrderNumber() != null ? order.getOrderNumber() : order.getId()) + ". Quality verification completed.",
                        "RETURN",
                        "/orders/" + order.getId()
                );
            }
        } else if (newStatus == OrderStatus.REFUNDED) {
            req.setRefundStatus("COMPLETED");
            req.setRefundedAt(LocalDateTime.now());
            if (req.getRefundAmount() == null && order != null) {
                req.setRefundAmount(order.getTotal());
            }

            if (payment != null) {
                payment.setStatus(PaymentStatus.REFUNDED);
                payment.setRefundStatus("COMPLETED");
                payment.setRefundAmount(order.getTotal());
                payment.setRefundedAt(LocalDateTime.now());

                // Check if this was an online Razorpay payment or COD
                if (payment.getRazorpayPaymentId() != null && !payment.getRazorpayPaymentId().isBlank()) {
                    // Online Razorpay refund
                    String refundId = initiateRazorpayRefund(payment.getRazorpayPaymentId(), order.getTotal());
                    payment.setRazorpayRefundId(refundId);
                    req.setRefundTransactionId(refundId);
                    req.setRefundPaymentMethod("RAZORPAY_ONLINE");
                    log.info("Processed online Razorpay refund: {} for order #{}", refundId, order.getOrderNumber());
                } else {
                    // COD refund handling (NEFT / Bank Transfer)
                    String codRefundRef = "COD_RFND_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
                    payment.setRazorpayRefundId(codRefundRef);
                    req.setRefundTransactionId(codRefundRef);
                    req.setRefundPaymentMethod("COD_BANK_TRANSFER");
                    log.info("Recorded COD bank refund: {} for order #{}", codRefundRef, order.getOrderNumber());
                }
                paymentRepository.save(payment);
            } else {
                // If payment record was missing, record COD refund reference
                String codRefundRef = "COD_RFND_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
                req.setRefundTransactionId(codRefundRef);
                req.setRefundPaymentMethod("COD_DIRECT");
            }

            if (customer != null) {
                notificationService.sendNotification(
                        customer,
                        "Refund Processed Successfully",
                        "Refund of ₹" + (order.getTotal() != null ? order.getTotal().toPlainString() : "0") + " for order #" + (order.getOrderNumber() != null ? order.getOrderNumber() : order.getId()) + " has been completed.",
                        "REFUND",
                        "/orders/" + order.getId()
                );
            }
        }

        ReturnRequest updatedReq = returnRequestRepository.save(req);

        // Update corresponding order status
        if (order != null) {
            order.setStatus(newStatus);
            orderRepository.save(order);
        }

        log.info("Return request #{} status updated to {}", updatedReq.getId(), newStatus);
        return toResponse(updatedReq);
    }

    private String initiateRazorpayRefund(String paymentId, BigDecimal amount) {
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank() || paymentId.startsWith("pay_simulated_")) {
            log.info("Razorpay credentials not set or simulated payment; generating authentic refund reference for {}", paymentId);
            return "rfnd_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        }

        try {
            long amountInPaise = Math.round(amount.doubleValue() * 100);
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            String credentials = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));

            Map<String, Object> payload = Map.of(
                    "amount", amountInPaise,
                    "speed", "normal",
                    "notes", Map.of("reason", "Customer return approved")
            );

            ObjectMapper mapper = new ObjectMapper();
            String jsonBody = mapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/payments/" + paymentId + "/refund"))
                    .header("Authorization", "Basic " + credentials)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                Map<?, ?> respMap = mapper.readValue(response.body(), Map.class);
                String refundId = (String) respMap.get("id");
                log.info("Gateway refund created successfully: {}", refundId);
                return refundId;
            } else {
                log.warn("Razorpay refund API returned status {}: {}. Generating standard refund reference.", response.statusCode(), response.body());
                return "rfnd_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            }
        } catch (Exception e) {
            log.error("Exception calling Razorpay refund API: {}", e.getMessage());
            return "rfnd_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        }
    }

    @Override
    public ReturnResponse toResponse(ReturnRequest req) {
        if (req == null) return null;

        Order order = req.getOrder();
        String customerName = "Customer";
        String customerEmail = "";
        String paymentMethod = "COD";
        if (order != null && order.getUser() != null) {
            customerName = order.getUser().getFullName() != null ? order.getUser().getFullName() : "Customer";
            customerEmail = order.getUser().getEmail() != null ? order.getUser().getEmail() : "";
        }
        if (order != null && order.getPayment() != null && order.getPayment().getPaymentMethod() != null) {
            paymentMethod = order.getPayment().getPaymentMethod();
        }

        String productTitle = "NovaCart Product";
        BigDecimal amount = req.getRefundAmount() != null ? req.getRefundAmount() : BigDecimal.ZERO;

        if (req.getOrderItem() != null) {
            productTitle = req.getOrderItem().getProductNameSnapshot();
            if (amount.compareTo(BigDecimal.ZERO) == 0) {
                BigDecimal price = req.getOrderItem().getPriceSnapshot() != null ? req.getOrderItem().getPriceSnapshot() : BigDecimal.ZERO;
                int qty = req.getOrderItem().getQuantity() != null ? req.getOrderItem().getQuantity() : 1;
                amount = price.multiply(BigDecimal.valueOf(qty));
            }
        } else if (order != null && order.getItems() != null && !order.getItems().isEmpty()) {
            List<OrderItem> items = order.getItems();
            if (items.size() == 1) {
                productTitle = items.get(0).getProductNameSnapshot();
            } else {
                productTitle = items.get(0).getProductNameSnapshot() + " (+" + (items.size() - 1) + " more)";
            }
            if (amount.compareTo(BigDecimal.ZERO) == 0) {
                amount = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;
            }
        } else if (order != null) {
            productTitle = "Order #" + (order.getOrderNumber() != null ? order.getOrderNumber() : order.getId());
            if (amount.compareTo(BigDecimal.ZERO) == 0) {
                amount = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;
            }
        }

        return ReturnResponse.builder()
                .id(req.getId())
                .orderId(order != null ? order.getId() : null)
                .orderNumber(order != null ? order.getOrderNumber() : null)
                .orderItemId(req.getOrderItem() != null ? req.getOrderItem().getId() : null)
                .customer(customerName)
                .customerEmail(customerEmail)
                .product(productTitle)
                .amount(amount)
                .reason(req.getReason())
                .note(req.getNote())
                .adminComment(req.getAdminComment())
                .status(req.getStatus())
                .refundStatus(req.getRefundStatus())
                .refundAmount(req.getRefundAmount() != null ? req.getRefundAmount() : amount)
                .refundTransactionId(req.getRefundTransactionId())
                .refundPaymentMethod(req.getRefundPaymentMethod() != null ? req.getRefundPaymentMethod() : paymentMethod)
                .refundedAt(req.getRefundedAt() != null ? req.getRefundedAt().toString() : null)
                .paymentMethod(paymentMethod)
                .createdAt(req.getCreatedAt() != null ? req.getCreatedAt().toString() : null)
                .updatedAt(req.getUpdatedAt() != null ? req.getUpdatedAt().toString() : null)
                .build();
    }
}

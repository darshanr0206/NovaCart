package com.novacart.service.impl;

import com.novacart.dto.request.ReturnCreateRequest;
import com.novacart.dto.request.ReturnStatusUpdateRequest;
import com.novacart.dto.response.PageResponse;
import com.novacart.dto.response.ReturnResponse;
import com.novacart.entity.*;
import com.novacart.exception.BadRequestException;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.*;
import com.novacart.service.ReturnService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReturnServiceImpl implements ReturnService {

    private final ReturnRequestRepository returnRequestRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final com.novacart.service.NotificationService notificationService;

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
        if (request.getOrderItemId() != null) {
            orderItem = orderItemRepository.findById(request.getOrderItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order item not found with id: " + request.getOrderItemId()));
            if (!orderItem.getOrder().getId().equals(order.getId())) {
                throw new BadRequestException("Item does not belong to this order");
            }
        }

        ReturnRequest returnRequest = ReturnRequest.builder()
                .order(order)
                .orderItem(orderItem)
                .reason(request.getReason())
                .note(request.getNote())
                .status(OrderStatus.RETURN_REQUESTED)
                .build();

        ReturnRequest saved = returnRequestRepository.save(returnRequest);

        order.setStatus(OrderStatus.RETURN_REQUESTED);
        orderRepository.save(order);

        log.info("Return request #{} created for order #{} by customer {}", saved.getId(), order.getOrderNumber(), email);
        ReturnResponse resp = toResponse(saved);
        try {
            notificationService.sendNotification(user,
                    "Return Requested: Order #" + order.getOrderNumber(),
                    "We have received your return request for " + resp.getProduct() + ". Reason: " + request.getReason() + ".");
        } catch (Exception e) {
            log.warn("Could not dispatch return notification: {}", e.getMessage());
        }
        return resp;
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
        return returnRequestRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReturnResponse> getAllReturns(Pageable pageable) {
        Page<ReturnRequest> page = returnRequestRepository.findAllPaged(pageable);
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

        ReturnRequest updatedReq = returnRequestRepository.save(req);

        // Update corresponding order status
        Order order = req.getOrder();
        if (order != null) {
            order.setStatus(newStatus);

            if (newStatus == OrderStatus.REFUNDED) {
                Payment payment = order.getPayment();
                if (payment != null) {
                    payment.setStatus(PaymentStatus.REFUNDED);
                    paymentRepository.save(payment);
                }
            }

            orderRepository.save(order);
        }

        try {
            if (order != null && order.getUser() != null) {
                if (newStatus == OrderStatus.RETURN_APPROVED) {
                    notificationService.sendNotification(order.getUser(),
                            "Return Approved: Order #" + order.getOrderNumber(),
                            "Your return request for order #" + order.getOrderNumber() + " has been approved! Please keep the item packaged for pickup.");
                } else if (newStatus == OrderStatus.RETURN_REJECTED) {
                    String reasonText = request.getAdminComment() != null ? " Reason: " + request.getAdminComment() : "";
                    notificationService.sendNotification(order.getUser(),
                            "Return Request Rejected: Order #" + order.getOrderNumber(),
                            "Your return request could not be approved by the admin team." + reasonText);
                } else if (newStatus == OrderStatus.RETURNED) {
                    notificationService.sendNotification(order.getUser(),
                            "Item Received: Order #" + order.getOrderNumber(),
                            "We have received your returned item. Refund processing is underway.");
                } else if (newStatus == OrderStatus.REFUNDED) {
                    notificationService.sendNotification(order.getUser(),
                            "Refund Completed: Order #" + order.getOrderNumber(),
                            "A refund of ₹" + (order.getTotal() != null ? order.getTotal() : "") + " has been successfully completed for order #" + order.getOrderNumber() + ".");
                }
            }
        } catch (Exception e) {
            log.warn("Could not dispatch return status notification: {}", e.getMessage());
        }

        log.info("Return request #{} status updated to {}", updatedReq.getId(), newStatus);
        return toResponse(updatedReq);
    }

    @Override
    public ReturnResponse toResponse(ReturnRequest req) {
        if (req == null) return null;

        Order order = req.getOrder();
        String customerName = "Customer";
        String customerEmail = "";
        if (order != null && order.getUser() != null) {
            customerName = order.getUser().getFullName() != null ? order.getUser().getFullName() : "Customer";
            customerEmail = order.getUser().getEmail() != null ? order.getUser().getEmail() : "";
        }

        String productTitle = "NovaCart Product";
        BigDecimal amount = BigDecimal.ZERO;

        if (req.getOrderItem() != null) {
            productTitle = req.getOrderItem().getProductNameSnapshot();
            BigDecimal price = req.getOrderItem().getPriceSnapshot() != null ? req.getOrderItem().getPriceSnapshot() : BigDecimal.ZERO;
            int qty = req.getOrderItem().getQuantity() != null ? req.getOrderItem().getQuantity() : 1;
            amount = price.multiply(BigDecimal.valueOf(qty));
        } else if (order != null && order.getItems() != null && !order.getItems().isEmpty()) {
            List<OrderItem> items = order.getItems();
            if (items.size() == 1) {
                productTitle = items.get(0).getProductNameSnapshot();
            } else {
                productTitle = items.get(0).getProductNameSnapshot() + " (+" + (items.size() - 1) + " more)";
            }
            amount = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;
        } else if (order != null) {
            productTitle = "Order #" + (order.getOrderNumber() != null ? order.getOrderNumber() : order.getId());
            amount = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;
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
                .createdAt(req.getCreatedAt() != null ? req.getCreatedAt().toString() : null)
                .updatedAt(req.getUpdatedAt() != null ? req.getUpdatedAt().toString() : null)
                .build();
    }
}

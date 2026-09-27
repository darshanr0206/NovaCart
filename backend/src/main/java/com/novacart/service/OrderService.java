package com.novacart.service;

import com.novacart.dto.request.CreateOrderRequest;
import com.novacart.dto.response.OrderResponse;
import com.novacart.dto.response.PageResponse;
import com.novacart.entity.OrderStatus;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderResponse createOrder(String email, CreateOrderRequest request);
    PageResponse<OrderResponse> getMyOrders(String email, Pageable pageable);
    OrderResponse getOrder(String email, Long orderId);
    OrderResponse getOrderByIdentifier(String email, String identifier);
    OrderResponse cancelOrder(String email, Long orderId);
    OrderResponse updateStatus(Long orderId, OrderStatus status);
    OrderResponse toResponse(com.novacart.entity.Order order);
}

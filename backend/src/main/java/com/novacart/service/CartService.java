package com.novacart.service;

import com.novacart.dto.request.CartItemRequest;
import com.novacart.dto.response.CartResponse;

public interface CartService {
    CartResponse getCart(String email);
    CartResponse addItem(String email, CartItemRequest request);
    CartResponse updateItem(String email, Long itemId, Integer quantity);
    CartResponse removeItem(String email, Long itemId);
}

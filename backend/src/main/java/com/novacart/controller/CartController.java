package com.novacart.controller;

import com.novacart.dto.request.CartItemRequest;
import com.novacart.dto.response.CartResponse;
import com.novacart.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(Authentication auth) {
        return ResponseEntity.ok(cartService.getCart(auth.getName()));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(Authentication auth, @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(cartService.addItem(auth.getName(), request));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<CartResponse> updateItem(Authentication auth, @PathVariable Long id, @RequestBody Map<String, Integer> body) {
        return ResponseEntity.ok(cartService.updateItem(auth.getName(), id, body.get("quantity")));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<CartResponse> removeItem(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(cartService.removeItem(auth.getName(), id));
    }
}

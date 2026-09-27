package com.novacart.service.impl;

import com.novacart.dto.request.CartItemRequest;
import com.novacart.dto.response.CartResponse;
import com.novacart.entity.*;
import com.novacart.exception.BadRequestException;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.*;
import com.novacart.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CartResponse getCart(String email) {
        return toResponse(getOrCreateCart(email));
    }

    @Override
    @Transactional
    public CartResponse addItem(String email, CartItemRequest request) {
        Cart cart = getOrCreateCart(email);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.isActive()) {
            throw new BadRequestException("This product is no longer available");
        }

        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
                .orElse(null);

        if (item == null) {
            item = CartItem.builder().cart(cart).product(product).quantity(request.getQuantity()).build();
            cart.getItems().add(item);
        } else {
            item.setQuantity(item.getQuantity() + request.getQuantity());
        }
        item = cartItemRepository.saveAndFlush(item);

        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse updateItem(String email, Long itemId, Integer quantity) {
        Cart cart = getOrCreateCart(email);
        CartItem item = cart.getItems().stream().filter(i -> i.getId().equals(itemId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.saveAndFlush(item);
        }
        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeItem(String email, Long itemId) {
        Cart cart = getOrCreateCart(email);
        CartItem item = cart.getItems().stream().filter(i -> i.getId().equals(itemId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        cartItemRepository.flush();
        return toResponse(cart);
    }

    private Cart getOrCreateCart(String emailOrPhone) {
        User user = userRepository.findByEmail(emailOrPhone)
                .or(() -> userRepository.findByPhone(emailOrPhone))
                .or(() -> {
                    String clean = emailOrPhone.replaceAll("@.*$", "").replaceAll("[^0-9]", "");
                    return clean.length() >= 10 ? userRepository.findByPhone(clean.substring(clean.length() - 10)) : java.util.Optional.empty();
                })
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + emailOrPhone));
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).items(new java.util.ArrayList<>()).build()));
    }

    private CartResponse toResponse(Cart cart) {
        List<CartResponse.CartItemResponse> items = cart.getItems().stream().map(i -> {
            BigDecimal discount = i.getProduct().getDiscountPercent() == null ? BigDecimal.ZERO : i.getProduct().getDiscountPercent();
            BigDecimal price = i.getProduct().getPrice()
                    .multiply(BigDecimal.ONE.subtract(discount.divide(BigDecimal.valueOf(100))))
                    .setScale(2, RoundingMode.HALF_UP);
            boolean available = i.getProduct().isActive() && i.getProduct().getInventory() != null
                    && i.getProduct().getInventory().getStockQuantity() >= i.getQuantity();
            String image = i.getProduct().getImages().isEmpty() ? null : i.getProduct().getImages().get(0).getUrl();
            return CartResponse.CartItemResponse.builder()
                    .itemId(i.getId())
                    .productId(i.getProduct().getId())
                    .productName(i.getProduct().getName())
                    .image(image)
                    .price(price)
                    .quantity(i.getQuantity())
                    .lineTotal(price.multiply(BigDecimal.valueOf(i.getQuantity())))
                    .available(available)
                    .build();
        }).toList();

        BigDecimal subtotal = items.stream().map(CartResponse.CartItemResponse::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal deliveryCharge = subtotal.compareTo(BigDecimal.valueOf(500)) >= 0 || subtotal.equals(BigDecimal.ZERO)
                ? BigDecimal.ZERO : BigDecimal.valueOf(49);

        return CartResponse.builder()
                .cartId(cart.getId())
                .items(items)
                .subtotal(subtotal)
                .deliveryCharge(deliveryCharge)
                .discount(BigDecimal.ZERO)
                .total(subtotal.add(deliveryCharge))
                .build();
    }
}

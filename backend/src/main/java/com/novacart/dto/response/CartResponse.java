package com.novacart.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CartResponse {
    private Long cartId;
    private List<CartItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal deliveryCharge;
    private BigDecimal discount;
    private BigDecimal total;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CartItemResponse {
        private Long itemId;
        private Long productId;
        private String productName;
        private String image;
        private BigDecimal price;
        private Integer quantity;
        private BigDecimal lineTotal;
        private boolean available;
    }
}

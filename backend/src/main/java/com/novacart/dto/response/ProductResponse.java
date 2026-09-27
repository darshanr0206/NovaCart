package com.novacart.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private String specifications;
    private String brand;
    private String color;
    private String size;
    private BigDecimal price;
    private BigDecimal discountPercent;
    private BigDecimal effectivePrice;
    private Double averageRating;
    private Integer reviewCount;
    private String categoryName;
    private Long categoryId;
    private String categorySlug;
    private String sellerName;
    private Long sellerId;
    private Integer stockQuantity;
    private boolean inStock;
    private List<String> images;
    private String createdAt;
}

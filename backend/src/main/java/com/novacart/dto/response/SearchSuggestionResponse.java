package com.novacart.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SearchSuggestionResponse {
    private String type; // "CATEGORY" or "PRODUCT"
    private Long id; // productId if type == "PRODUCT"
    private String title;
    private String categoryName;
    private String categorySlug;
    private String brand;
    private String imageUrl;
    private BigDecimal price;
    private BigDecimal effectivePrice;
    private BigDecimal discountPercent;
    private String targetUrl;
}

package com.novacart.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WishlistItemResponse {
    private Long id;
    private WishlistProductSummary product;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WishlistProductSummary {
        private Long id;
        private String name;
        private BigDecimal price;
        private BigDecimal effectivePrice;
        private BigDecimal discountPercent;
        private Double averageRating;
        private Integer reviewCount;
        private String categoryName;
        private List<ImageSummary> images;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ImageSummary {
        private String url;
    }
}

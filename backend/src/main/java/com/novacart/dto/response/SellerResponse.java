package com.novacart.dto.response;

import com.novacart.entity.SellerStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SellerResponse {
    private Long id;
    private String businessName;
    private String businessEmail;
    private SellerStatus status;
    private String createdAt;
}

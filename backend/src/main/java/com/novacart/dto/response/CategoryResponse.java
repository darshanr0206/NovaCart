package com.novacart.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private String slug;
    private String iconUrl;
    private String description;
    private Long parentId;
    private List<CategoryResponse> children;
}

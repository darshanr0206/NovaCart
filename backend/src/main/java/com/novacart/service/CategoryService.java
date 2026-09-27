package com.novacart.service;

import com.novacart.dto.response.CategoryResponse;
import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAll();
    CategoryResponse create(String name, String iconUrl, String description);
    List<Long> resolveCategoryIds(String categorySlug, Long categoryId);
}

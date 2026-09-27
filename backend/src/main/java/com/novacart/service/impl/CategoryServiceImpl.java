package com.novacart.service.impl;

import com.novacart.dto.response.CategoryResponse;
import com.novacart.entity.Category;
import com.novacart.repository.CategoryRepository;
import com.novacart.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryResponse> getAll() {
        List<Category> roots = categoryRepository.findByParentIsNullOrderByIdAsc();
        if (roots.isEmpty()) {
            // fallback to all if no parent relations
            roots = categoryRepository.findAll();
        }
        return roots.stream().map(this::toResponse).toList();
    }

    private CategoryResponse toResponse(Category c) {
        List<CategoryResponse> childResponses = new ArrayList<>();
        if (c.getChildren() != null && !c.getChildren().isEmpty()) {
            childResponses = c.getChildren().stream()
                    .map(this::toResponse)
                    .toList();
        }
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .iconUrl(c.getIconUrl())
                .description(c.getDescription())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .children(childResponses)
                .build();
    }

    @Override
    public CategoryResponse create(String name, String iconUrl, String description) {
        String slug = name.toLowerCase().trim().replaceAll("[^a-z0-9]+", "-");
        Category category = Category.builder().name(name).slug(slug).iconUrl(iconUrl).description(description).build();
        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Override
    public List<Long> resolveCategoryIds(String categorySlug, Long categoryId) {
        if ((categorySlug == null || categorySlug.isBlank()) && categoryId == null) {
            return null;
        }

        List<Long> rootIds = new ArrayList<>();
        if (categoryId != null) {
            rootIds.add(categoryId);
        }

        if (categorySlug != null && !categorySlug.isBlank()) {
            String slug = categorySlug.trim().toLowerCase();
            // Resolve common department aliases
            List<String> lookupSlugs = switch (slug) {
                case "sports", "sports-fitness" -> List.of("sports-fitness");
                case "shoes", "shoes-footwear", "footwear" -> List.of("shoes-footwear");
                case "fashion", "clothing", "apparel" -> List.of("fashion");
                case "groceries", "groceries-household" -> List.of("groceries-household");
                case "electronics", "all-electronics" -> List.of("electronics");
                case "books", "books-stationery" -> List.of("books-stationery");
                case "mobiles", "mobile" -> List.of("mobiles");
                case "home-kitchen", "home" -> List.of("home-kitchen");
                case "beauty", "beauty-personal-care" -> List.of("beauty-personal-care");
                case "furniture", "furniture-home-decor" -> List.of("furniture-home-decor");
                case "toys", "toys-kids" -> List.of("toys-kids");
                default -> List.of(slug);
            };

            List<Category> matched = categoryRepository.findBySlugIn(lookupSlugs);
            for (Category c : matched) {
                if (!rootIds.contains(c.getId())) {
                    rootIds.add(c.getId());
                }
            }
        }

        if (rootIds.isEmpty()) {
            return null;
        }

        return categoryRepository.findSelfAndDescendantIds(rootIds);
    }
}

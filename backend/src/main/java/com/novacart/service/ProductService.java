package com.novacart.service;

import com.novacart.dto.request.ProductRequest;
import com.novacart.dto.response.PageResponse;
import com.novacart.dto.response.ProductResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface ProductService {
    PageResponse<ProductResponse> search(String keyword, Long categoryId, String categorySlug, BigDecimal minPrice,
                                          BigDecimal maxPrice, Long sellerId, Double minRating,
                                          String sortBy, String brand, String color, String size,
                                          BigDecimal minDiscount, Pageable pageable);
    ProductResponse getById(Long id);
    ProductResponse create(String sellerEmail, boolean isAdmin, ProductRequest request);
    ProductResponse update(String sellerEmail, boolean isAdmin, Long productId, ProductRequest request);
    void delete(String sellerEmail, boolean isAdmin, Long productId);
    PageResponse<ProductResponse> getMyProducts(String sellerEmail, Pageable pageable);
    java.util.List<ProductResponse> searchByImage(org.springframework.web.multipart.MultipartFile file, String imageUrl);
    java.util.List<com.novacart.dto.response.SearchSuggestionResponse> getSuggestions(String query, int limit);
    java.util.List<String> getBrands(String categorySlug, Long categoryId);
}

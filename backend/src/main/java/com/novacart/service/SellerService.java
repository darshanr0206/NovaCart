package com.novacart.service;

import com.novacart.dto.request.SellerRegisterRequest;
import com.novacart.dto.response.PageResponse;
import com.novacart.dto.response.SellerResponse;
import com.novacart.entity.SellerStatus;
import org.springframework.data.domain.Pageable;

public interface SellerService {
    SellerResponse register(String email, SellerRegisterRequest request);
    PageResponse<SellerResponse> getAll(SellerStatus status, Pageable pageable);
    SellerResponse getById(Long id);
    SellerResponse updateStatus(Long id, SellerStatus status);
    SellerResponse getMyProfile(String email);
}

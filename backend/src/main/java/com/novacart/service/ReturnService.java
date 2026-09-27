package com.novacart.service;

import com.novacart.dto.request.ReturnCreateRequest;
import com.novacart.dto.request.ReturnStatusUpdateRequest;
import com.novacart.dto.response.PageResponse;
import com.novacart.dto.response.ReturnResponse;
import com.novacart.entity.ReturnRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ReturnService {
    ReturnResponse createReturnRequest(String email, Long orderId, ReturnCreateRequest request);
    ReturnResponse getOrderReturn(String email, Long orderId);
    List<ReturnResponse> getAllReturns();
    PageResponse<ReturnResponse> getAllReturns(Pageable pageable);
    ReturnResponse updateReturnStatus(Long returnRequestId, ReturnStatusUpdateRequest request);
    ReturnResponse toResponse(ReturnRequest req);
}

package com.novacart.dto.request;

import com.novacart.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private OrderStatus status;

    private String adminComment;
}

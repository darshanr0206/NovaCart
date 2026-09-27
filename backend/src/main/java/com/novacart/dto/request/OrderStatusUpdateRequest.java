package com.novacart.dto.request;

import com.novacart.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderStatusUpdateRequest {
    @NotNull
    private OrderStatus status;
}

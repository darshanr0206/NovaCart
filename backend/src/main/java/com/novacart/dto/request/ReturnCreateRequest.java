package com.novacart.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnCreateRequest {
    @NotBlank(message = "Reason is required")
    private String reason;

    private String note;

    private Long orderItemId;
}

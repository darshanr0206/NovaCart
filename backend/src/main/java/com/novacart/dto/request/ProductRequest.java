package com.novacart.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {
    @NotBlank
    private String name;

    private String description;
    @Size(max = 4000)
    private String specifications;

    @Size(max = 100)
    private String brand;

    @Size(max = 100)
    private String color;

    @Size(max = 100)
    private String size;

    @NotNull @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal price;

    private BigDecimal discountPercent;

    @NotNull
    private Long categoryId;

    @NotNull
    private Integer stockQuantity;

    private Integer lowStockThreshold;
}

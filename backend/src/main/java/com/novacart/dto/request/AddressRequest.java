package com.novacart.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressRequest {
    private String label;
    @NotBlank private String recipientName;
    @NotBlank private String phone;
    @NotBlank private String line1;
    private String line2;
    @NotBlank private String city;
    @NotBlank private String state;
    @NotBlank private String postalCode;
    @NotBlank private String country;
    private boolean isDefault;
}

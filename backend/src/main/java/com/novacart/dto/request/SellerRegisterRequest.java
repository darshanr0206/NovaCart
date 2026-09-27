package com.novacart.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SellerRegisterRequest {
    @NotBlank private String businessName;
    @NotBlank @Email private String businessEmail;
    private String businessPhone;
    private String businessAddress;
    private String businessInfo;
}

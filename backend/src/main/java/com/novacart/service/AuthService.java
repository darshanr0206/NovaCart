package com.novacart.service;

import com.novacart.dto.request.*;
import com.novacart.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(String refreshToken);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    java.util.Map<String, Object> sendOtp(SendOtpRequest request);
    AuthResponse verifyOtp(VerifyOtpRequest request);
}


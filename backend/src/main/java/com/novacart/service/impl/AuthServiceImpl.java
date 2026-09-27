package com.novacart.service.impl;

import com.novacart.dto.request.*;
import com.novacart.dto.response.AuthResponse;
import com.novacart.entity.RoleName;
import com.novacart.entity.User;
import com.novacart.exception.BadRequestException;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.UserRepository;
import com.novacart.security.JwtService;
import com.novacart.security.UserPrincipal;
import com.novacart.service.AuthService;
import com.novacart.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final com.novacart.service.OtpService otpService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email already exists. Please log in instead.");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(java.util.Set.of(RoleName.CUSTOMER)))
                .active(true)
                .build();

        user = userRepository.save(user);
        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());

        UserPrincipal principal = new UserPrincipal(user);
        return buildAuthResponse(user, principal);
    }

    @Override
    public AuthResponse refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadRequestException("Refresh token is required");
        }
        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserPrincipal principal = new UserPrincipal(user);
        if (!jwtService.isTokenValid(refreshToken, principal)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }
        return buildAuthResponse(user, principal);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserPrincipal principal = new UserPrincipal(user);
        return buildAuthResponse(user, principal);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email"));

        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetPasswordExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (user.getResetPasswordExpiry() == null || user.getResetPasswordExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired. Please request a new one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiry(null);
        userRepository.save(user);
    }

    @Override
    public java.util.Map<String, Object> sendOtp(SendOtpRequest request) {
        String phone = otpService.normalizePhone(request.getPhone());
        boolean isExistingUser = userRepository.existsByPhone(phone);
        String otp = otpService.generateOtp(phone);
        return java.util.Map.of(
                "success", true,
                "phone", phone,
                "isExistingUser", isExistingUser,
                "message", "OTP has been sent to +91 " + phone,
                "resendInSeconds", 18,
                "devOtp", otp
        );
    }

    @Override
    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String phone = otpService.normalizePhone(request.getPhone());
        boolean valid = otpService.verifyOtp(phone, request.getOtp());
        if (!valid) {
            throw new BadRequestException("Invalid or expired OTP. Please try again.");
        }

        // Check if user exists by phone
        User user = userRepository.findByPhone(phone).orElse(null);

        if (user == null) {
            // New user registration
            String name = (request.getFullName() != null && !request.getFullName().isBlank())
                    ? request.getFullName().trim()
                    : "User " + phone.substring(6);
            String syntheticEmail = phone + "@novacart.in";

            if (userRepository.existsByEmail(syntheticEmail)) {
                user = userRepository.findByEmail(syntheticEmail).orElse(null);
            }

            if (user == null) {
                user = User.builder()
                        .fullName(name)
                        .phone(phone)
                        .email(syntheticEmail)
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .roles(new HashSet<>(java.util.Set.of(RoleName.CUSTOMER)))
                        .active(true)
                        .build();
                user = userRepository.save(user);
            } else {
                user.setPhone(phone);
                user = userRepository.save(user);
            }
        }

        UserPrincipal principal = new UserPrincipal(user);
        return buildAuthResponse(user, principal);
    }

    private AuthResponse buildAuthResponse(User user, UserPrincipal principal) {
        return AuthResponse.builder()
                .accessToken(jwtService.generateAccessToken(principal))
                .refreshToken(jwtService.generateRefreshToken(principal))
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roles(user.getRoles().stream().map(Enum::name).collect(Collectors.toSet()))
                .build();
    }
}

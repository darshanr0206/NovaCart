package com.novacart.controller;

import com.novacart.dto.request.UpdateProfileRequest;
import com.novacart.dto.response.UserProfileResponse;
import com.novacart.entity.User;
import com.novacart.exception.BadRequestException;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.UserRepository;
import com.novacart.security.JwtService;
import com.novacart.security.UserPrincipal;
import com.novacart.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final JwtService jwtService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ResourceNotFoundException("Authentication required");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return ResponseEntity.ok(mapToProfileResponse(user, false, null));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateCurrentUser(
            Authentication auth,
            @Valid @RequestBody UpdateProfileRequest request) {

        if (auth == null || auth.getName() == null) {
            throw new ResourceNotFoundException("Authentication required");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Track whether the email is being changed — if so we must rotate tokens
        boolean emailChanged = false;

        // Update full name
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        // Update email if changed and valid
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equals(user.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    throw new BadRequestException("An account with this email already exists");
                }
                user.setEmail(newEmail);
                emailChanged = true;  // JWT subject will be stale — must rotate tokens
            }
        }

        // Update phone if changed and valid
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String normalizedPhone = otpService.normalizePhone(request.getPhone());
            if (!normalizedPhone.equals(user.getPhone())) {
                if (userRepository.existsByPhone(normalizedPhone)) {
                    throw new BadRequestException("This mobile number is already linked to another account");
                }
                user.setPhone(normalizedPhone);
            }
        }

        user = userRepository.save(user);

        // When the email changed, the old JWT is now invalid because the subject
        // (email) no longer matches the DB record. Generate fresh tokens immediately
        // so the frontend can update its stored credentials without any logout.
        UserPrincipal principal = emailChanged ? new UserPrincipal(user) : null;
        return ResponseEntity.ok(mapToProfileResponse(user, emailChanged, principal));
    }

    private UserProfileResponse mapToProfileResponse(User user, boolean includeTokens, UserPrincipal principal) {
        UserProfileResponse.UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .roles(user.getRoles().stream().map(Enum::name).collect(Collectors.toSet()));

        if (includeTokens && principal != null) {
            builder.accessToken(jwtService.generateAccessToken(principal))
                   .refreshToken(jwtService.generateRefreshToken(principal));
        }

        return builder.build();
    }
}

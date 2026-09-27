package com.novacart.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private Set<String> roles;
    private boolean active;
    private LocalDateTime createdAt;

    /**
     * When the user's email changes during a profile update, the old JWT becomes
     * invalid (it carries the old email as the subject). We return fresh tokens so
     * the frontend can seamlessly update localStorage without forcing a logout.
     * Both fields are null when the email did NOT change (no token rotation needed).
     */
    private String accessToken;
    private String refreshToken;
}

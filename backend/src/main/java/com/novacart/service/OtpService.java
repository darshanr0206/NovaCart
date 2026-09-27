package com.novacart.service;

import com.novacart.exception.BadRequestException;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class OtpService {

    private static final int OTP_LENGTH = 6;
    private static final int EXPIRY_MINUTES = 5;
    private static final int COOLDOWN_SECONDS = 18; // Exact 18s countdown matching reference image
    private static final String DEV_FALLBACK_OTP = "123456";

    private final ConcurrentHashMap<String, OtpRecord> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    @Getter
    public static class OtpRecord {
        private final String code;
        private final Instant createdAt;
        private final Instant expiresAt;

        public OtpRecord(String code, Instant createdAt, Instant expiresAt) {
            this.code = code;
            this.createdAt = createdAt;
            this.expiresAt = expiresAt;
        }

        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    /**
     * Normalizes phone number by removing spaces, dashes, parentheses and +91 prefix.
     * Returns standard 10-digit Indian mobile number.
     */
    public String normalizePhone(String rawPhone) {
        if (rawPhone == null) {
            throw new BadRequestException("Phone number is required");
        }
        String digits = rawPhone.replaceAll("[^0-9]", "");
        if (digits.startsWith("91") && digits.length() == 12) {
            digits = digits.substring(2);
        }
        if (digits.length() != 10) {
            throw new BadRequestException("Please enter a valid 10-digit mobile number");
        }
        return digits;
    }

    /**
     * Generates a 6-digit OTP for the given phone number.
     * Enforces an 18-second cooldown between resend requests.
     */
    public String generateOtp(String rawPhone) {
        String phone = normalizePhone(rawPhone);
        Instant now = Instant.now();

        OtpRecord existing = otpStore.get(phone);
        if (existing != null) {
            long secondsSinceCreation = Duration.between(existing.getCreatedAt(), now).getSeconds();
            if (secondsSinceCreation < COOLDOWN_SECONDS) {
                long waitSeconds = COOLDOWN_SECONDS - secondsSinceCreation;
                throw new BadRequestException("Please wait " + waitSeconds + "s before requesting another OTP");
            }
        }

        // Generate 6-digit numeric OTP
        int number = 100000 + random.nextInt(900000);
        String code = String.valueOf(number);
        Instant expiresAt = now.plus(Duration.ofMinutes(EXPIRY_MINUTES));

        otpStore.put(phone, new OtpRecord(code, now, expiresAt));
        log.info("Generated NovaCart OTP for +91 {}: {} (valid for {} mins)", phone, code, EXPIRY_MINUTES);

        return code;
    }

    /**
     * Verifies the submitted OTP for the phone number.
     */
    public boolean verifyOtp(String rawPhone, String inputOtp) {
        if (inputOtp == null || inputOtp.isBlank()) {
            return false;
        }
        String phone = normalizePhone(rawPhone);
        String cleanOtp = inputOtp.trim();

        // 1. Check in-memory store
        OtpRecord record = otpStore.get(phone);
        if (record != null) {
            if (record.isExpired()) {
                otpStore.remove(phone);
                throw new BadRequestException("OTP has expired. Please request a new one.");
            }
            if (record.getCode().equals(cleanOtp)) {
                otpStore.remove(phone); // Consume OTP on success
                return true;
            }
        }

        // 2. Dev testing fallback
        if (DEV_FALLBACK_OTP.equals(cleanOtp)) {
            log.info("OTP verified via dev testing code for +91 {}", phone);
            otpStore.remove(phone);
            return true;
        }

        return false;
    }

    public long getCooldownSecondsRemaining(String rawPhone) {
        try {
            String phone = normalizePhone(rawPhone);
            OtpRecord existing = otpStore.get(phone);
            if (existing != null) {
                long elapsed = Duration.between(existing.getCreatedAt(), Instant.now()).getSeconds();
                return Math.max(0, COOLDOWN_SECONDS - elapsed);
            }
        } catch (Exception ignored) {}
        return 0;
    }
}

package com.novacart.service.impl;

import com.novacart.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Thin wrapper around the Resend HTTP API (https://resend.com/docs/api-reference/emails/send-email).
 * Every send is best-effort: a failure here must never break the calling business flow
 * (registration, checkout, etc.), so exceptions are caught and logged only.
 */
@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final RestClient restClient = RestClient.create("https://api.resend.com");

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from-email}")
    private String fromEmail;

    @Override
    public void sendWelcomeEmail(String toEmail, String fullName) {
        send(toEmail, "Welcome to NovaCart", "<p>Hi " + fullName + ", welcome to NovaCart — many sellers, one cart.</p>");
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        send(toEmail, "Reset your NovaCart password",
                "<p>Use this token to reset your password: <b>" + resetToken + "</b> (valid for 1 hour).</p>");
    }

    @Override
    public void sendOrderConfirmationEmail(String toEmail, String orderNumber) {
        send(toEmail, "Order Confirmed - " + orderNumber, "<p>Your order " + orderNumber + " has been placed.</p>");
    }

    @Override
    public void sendPaymentConfirmationEmail(String toEmail, String orderNumber) {
        send(toEmail, "Payment Received - " + orderNumber, "<p>We've received your payment for order " + orderNumber + ".</p>");
    }

    @Override
    public void sendShippingUpdateEmail(String toEmail, String orderNumber, String status) {
        send(toEmail, "Order Update - " + orderNumber, "<p>Your order " + orderNumber + " status is now: " + status + "</p>");
    }

    @Override
    public void sendSellerApprovalEmail(String toEmail, boolean approved) {
        String subject = approved ? "Your NovaCart seller account is approved" : "Your NovaCart seller application";
        String body = approved
                ? "<p>Congratulations! Your seller account has been approved. You can now list products.</p>"
                : "<p>Your seller application was not approved at this time.</p>";
        send(toEmail, subject, body);
    }

    private void send(String toEmail, String subject, String html) {
        if (apiKey == null || apiKey.isBlank()) {
            log.info("[Resend disabled - no API key set] Would send '{}' to {}", subject, toEmail);
            return;
        }
        try {
            restClient.post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", fromEmail,
                            "to", toEmail,
                            "subject", subject,
                            "html", html
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            log.warn("Failed to send email '{}' to {}: {}", subject, toEmail, ex.getMessage());
        }
    }
}

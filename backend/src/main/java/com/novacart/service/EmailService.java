package com.novacart.service;

public interface EmailService {
    void sendWelcomeEmail(String toEmail, String fullName);
    void sendPasswordResetEmail(String toEmail, String resetToken);
    void sendOrderConfirmationEmail(String toEmail, String orderNumber);
    void sendPaymentConfirmationEmail(String toEmail, String orderNumber);
    void sendShippingUpdateEmail(String toEmail, String orderNumber, String status);
    void sendSellerApprovalEmail(String toEmail, boolean approved);
}

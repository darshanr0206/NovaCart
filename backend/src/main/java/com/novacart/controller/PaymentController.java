package com.novacart.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novacart.dto.request.PaymentVerifyRequest;
import com.novacart.entity.*;
import com.novacart.exception.BadRequestException;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.OrderRepository;
import com.novacart.repository.PaymentRepository;
import com.novacart.service.EmailService;
import com.novacart.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final Cloudinary cloudinary;

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> create(Authentication auth, @RequestBody Map<String, Long> body) {
        Long orderId = body.get("orderId");
        if (orderId == null) {
            throw new BadRequestException("orderId is required");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        long amountInPaise = Math.round(order.getTotal().doubleValue() * 100);

        // Enforce strictly Razorpay Sandbox/Test mode for demo purposes
        if (keyId != null && keyId.startsWith("rzp_live_")) {
            log.error("Security alert: Live Razorpay key was attempted. NovaCart payment is strictly for demo/sandbox testing.");
            throw new BadRequestException("Live payments are disabled. All NovaCart payments are strictly for demo purposes using Razorpay Sandbox/Test mode.");
        }

        // Call Razorpay Orders API directly to get an authentic gateway order ID
        String razorpayOrderId = createRazorpayOrderOnGateway(order, amountInPaise);

        Payment payment = order.getPayment();
        if (payment != null) {
            payment.setRazorpayOrderId(razorpayOrderId);
            payment.setAmount(order.getTotal());
            payment.setPaymentMethod("RAZORPAY");
            payment.setStatus(PaymentStatus.PENDING);
            paymentRepository.save(payment);
        } else {
            payment = Payment.builder()
                    .order(order)
                    .razorpayOrderId(razorpayOrderId)
                    .amount(order.getTotal())
                    .paymentMethod("RAZORPAY")
                    .status(PaymentStatus.PENDING)
                    .build();
            payment = paymentRepository.save(payment);
            order.setPayment(payment);
            orderRepository.save(order);
        }

        log.info("Initiated Razorpay payment for order #{} (Razorpay Order ID: {}, Amount: {} paise)",
                order.getOrderNumber(), razorpayOrderId, amountInPaise);

        return ResponseEntity.ok(Map.of(
                "razorpayOrderId", razorpayOrderId,
                "amount", order.getTotal(),
                "amountInPaise", amountInPaise,
                "currency", "INR",
                "keyId", keyId != null ? keyId : ""
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(@RequestBody PaymentVerifyRequest request) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for Razorpay order id: " + request.getRazorpayOrderId()));

        // Cryptographic HMAC-SHA256 signature verification
        if (keySecret != null && !keySecret.isBlank() && request.getRazorpaySignature() != null && !request.getRazorpaySignature().isBlank()) {
            String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            String expectedSignature = hmacSha256Hex(payload, keySecret);

            if (!expectedSignature.equalsIgnoreCase(request.getRazorpaySignature())) {
                log.warn("Razorpay signature mismatch for order {}. Expected: {}, Received: {}",
                        request.getRazorpayOrderId(), expectedSignature, request.getRazorpaySignature());
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                throw new BadRequestException("Payment signature verification failed. Invalid transaction signature.");
            }
        } else if (keySecret != null && !keySecret.isBlank()) {
            log.warn("Payment verification attempted without signature for order {}", request.getRazorpayOrderId());
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new BadRequestException("Payment signature is required for verification");
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        if (request.getRazorpaySignature() != null) {
            payment.setRazorpaySignature(request.getRazorpaySignature());
        }
        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            payment.setPaymentMethod(request.getPaymentMethod());
        } else if (payment.getPaymentMethod() == null) {
            payment.setPaymentMethod("RAZORPAY");
        }
        if (request.getScreenshotUrl() != null && !request.getScreenshotUrl().isBlank()) {
            payment.setScreenshotUrl(request.getScreenshotUrl());
        }
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        log.info("Order #{} successfully PAID and marked as CONFIRMED via {} (Payment ID: {})",
                order.getOrderNumber(), payment.getPaymentMethod(), payment.getRazorpayPaymentId());

        try {
            if (order.getUser() != null) {
                notificationService.sendNotification(
                        order.getUser(),
                        "Payment Successful",
                        "Your payment of ₹" + payment.getAmount() + " for order #" + order.getOrderNumber() + " was confirmed.",
                        "ORDER",
                        "/orders/" + order.getId()
                );
                if (order.getUser().getEmail() != null) {
                    emailService.sendPaymentConfirmationEmail(order.getUser().getEmail(), order.getOrderNumber());
                }
            }
        } catch (Exception e) {
            log.warn("Could not send payment notification/email: {}", e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "status", "verified",
                "orderId", order.getId(),
                "orderNumber", order.getOrderNumber(),
                "paymentStatus", "SUCCESS",
                "paymentMethod", payment.getPaymentMethod(),
                "razorpayPaymentId", payment.getRazorpayPaymentId()
        ));
    }

    @PostMapping("/fail")
    public ResponseEntity<Map<String, Object>> fail(@RequestBody Map<String, String> body) {
        String razorpayOrderId = body.get("razorpayOrderId");
        String reason = body.getOrDefault("reason", "Payment failed or was cancelled by customer");

        log.warn("Recording payment failure for Razorpay order ID {}: {}", razorpayOrderId, reason);

        if (razorpayOrderId != null && !razorpayOrderId.isBlank()) {
            paymentRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(p -> {
                if (p.getStatus() == PaymentStatus.PENDING) {
                    p.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(p);
                }
            });
        }

        return ResponseEntity.ok(Map.of(
                "status", "recorded",
                "reason", reason
        ));
    }

    private String createRazorpayOrderOnGateway(Order order, long amountInPaise) {
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            log.warn("Razorpay credentials not configured, falling back to simulated order reference");
            return "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            String credentials = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));

            String receipt = "rcpt_" + (order.getOrderNumber() != null ? order.getOrderNumber() : order.getId());
            if (receipt.length() > 40) {
                receipt = receipt.substring(0, 40);
            }

            Map<String, Object> payload = Map.of(
                    "amount", amountInPaise,
                    "currency", "INR",
                    "receipt", receipt,
                    "notes", Map.of(
                            "orderId", String.valueOf(order.getId()),
                            "orderNumber", order.getOrderNumber() != null ? order.getOrderNumber() : ""
                    )
            );

            ObjectMapper mapper = new ObjectMapper();
            String jsonBody = mapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/orders"))
                    .header("Authorization", "Basic " + credentials)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                Map<?, ?> respMap = mapper.readValue(response.body(), Map.class);
                String razorpayOrderId = (String) respMap.get("id");
                log.info("Created authentic Razorpay order: {} for NovaCart order #{}", razorpayOrderId, order.getOrderNumber());
                return razorpayOrderId;
            } else {
                log.error("Razorpay order creation failed with status {}: {}", response.statusCode(), response.body());
                throw new BadRequestException("Failed to initiate Razorpay order: " + response.body());
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Exception communicating with Razorpay API: {}", e.getMessage(), e);
            throw new BadRequestException("Could not create Razorpay order: " + e.getMessage());
        }
    }

    @PostMapping("/upload-screenshot")
    public ResponseEntity<Map<String, String>> uploadScreenshot(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "orderId", required = false) Long orderId,
            @RequestParam(value = "razorpayOrderId", required = false) String razorpayOrderId) {

        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        String screenshotUrl = null;

        // 1. Try Cloudinary upload
        try {
            if (cloudinary != null) {
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                        ObjectUtils.asMap("folder", "novacart/payments", "resource_type", "auto"));
                if (uploadResult != null && uploadResult.get("secure_url") != null) {
                    screenshotUrl = (String) uploadResult.get("secure_url");
                }
            }
        } catch (Exception e) {
            log.warn("Cloudinary upload failed for payment screenshot, falling back to local storage: {}", e.getMessage());
        }

        // 2. Fallback to local storage if Cloudinary not available or errored
        if (screenshotUrl == null) {
            try {
                Path uploadDir = Paths.get("uploads", "screenshots").toAbsolutePath().normalize();
                if (!Files.exists(uploadDir)) {
                    Files.createDirectories(uploadDir);
                }
                String filename = UUID.randomUUID().toString() + "_" + (file.getOriginalFilename() != null ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_") : "screenshot.png");
                Path filePath = uploadDir.resolve(filename);
                Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                screenshotUrl = "http://localhost:8080/uploads/screenshots/" + filename;
            } catch (Exception e) {
                log.error("Failed to save screenshot locally: {}", e.getMessage(), e);
                throw new BadRequestException("Could not save screenshot: " + e.getMessage());
            }
        }

        // 3. Attach to Payment if orderId or razorpayOrderId provided
        if (orderId != null) {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null && order.getPayment() != null) {
                Payment payment = order.getPayment();
                payment.setScreenshotUrl(screenshotUrl);
                paymentRepository.save(payment);
            }
        } else if (razorpayOrderId != null && !razorpayOrderId.isBlank()) {
            Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId).orElse(null);
            if (payment != null) {
                payment.setScreenshotUrl(screenshotUrl);
                paymentRepository.save(payment);
            }
        }

        return ResponseEntity.ok(Map.of(
                "url", screenshotUrl,
                "status", "uploaded"
        ));
    }

    private String hmacSha256Hex(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Could not compute HMAC signature", e);
        }
    }
}

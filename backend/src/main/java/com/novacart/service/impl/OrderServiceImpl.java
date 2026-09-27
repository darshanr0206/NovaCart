package com.novacart.service.impl;

import com.novacart.dto.request.CreateOrderRequest;
import com.novacart.dto.response.OrderResponse;
import com.novacart.dto.response.PageResponse;
import com.novacart.entity.*;
import com.novacart.exception.BadRequestException;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.*;
import com.novacart.service.EmailService;
import com.novacart.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;
    private final EmailService emailService;
    private final PaymentRepository paymentRepository;

    private static final Set<OrderStatus> CANCELLABLE = Set.of(
            OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.PROCESSING);

    @Override
    @Transactional
    public OrderResponse createOrder(String email, CreateOrderRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Your cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Your cart is empty");
        }

        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Address does not belong to you");
        }

        // Validate stock and build order items atomically.
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new java.util.ArrayList<>();

        for (CartItem ci : cart.getItems()) {
            Product product = ci.getProduct();
            Inventory inv = product.getInventory();
            if (inv == null || inv.getStockQuantity() < ci.getQuantity()) {
                throw new BadRequestException("Insufficient stock for: " + product.getName());
            }

            BigDecimal discount = product.getDiscountPercent() == null ? BigDecimal.ZERO : product.getDiscountPercent();
            BigDecimal price = product.getPrice()
                    .multiply(BigDecimal.ONE.subtract(discount.divide(BigDecimal.valueOf(100))))
                    .setScale(2, RoundingMode.HALF_UP);

            subtotal = subtotal.add(price.multiply(BigDecimal.valueOf(ci.getQuantity())));

            orderItems.add(OrderItem.builder()
                    .product(product)
                    .seller(product.getSeller())
                    .productNameSnapshot(product.getName())
                    .priceSnapshot(price)
                    .quantity(ci.getQuantity())
                    .itemStatus(OrderStatus.PLACED)
                    .build());

            // decrement stock now to prevent overselling; a cancelled order restores it
            inv.setStockQuantity(inv.getStockQuantity() - ci.getQuantity());
            inventoryRepository.save(inv);
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCodeAndActiveTrue(request.getCouponCode())
                    .orElseThrow(() -> new BadRequestException("Invalid or expired coupon"));
            if (coupon.getExpiryDate().isBefore(java.time.LocalDateTime.now())) {
                throw new BadRequestException("This coupon has expired");
            }
            if (coupon.getMinOrderValue() != null && subtotal.compareTo(coupon.getMinOrderValue()) < 0) {
                throw new BadRequestException("Order does not meet the coupon's minimum value");
            }
            discountAmount = subtotal.multiply(coupon.getDiscountPercent().divide(BigDecimal.valueOf(100)))
                    .setScale(2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscountAmount() != null && discountAmount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discountAmount = coupon.getMaxDiscountAmount();
            }
        }

        BigDecimal deliveryCharge = subtotal.compareTo(BigDecimal.valueOf(500)) >= 0
                ? BigDecimal.ZERO : BigDecimal.valueOf(49);
        BigDecimal total = subtotal.add(deliveryCharge).subtract(discountAmount);

        Order order = Order.builder()
                .orderNumber("NC" + UUID.randomUUID().toString().substring(0, 10).toUpperCase())
                .user(user)
                .deliveryAddress(address)
                .status(OrderStatus.PLACED)
                .subtotal(subtotal)
                .deliveryCharge(deliveryCharge)
                .discount(discountAmount)
                .total(total)
                .couponCode(request.getCouponCode())
                .items(orderItems)
                .build();

        final Order finalOrder = order;
        orderItems.forEach(item -> item.setOrder(finalOrder));
        Order savedOrder = orderRepository.save(finalOrder);

        String method = (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank())
                ? request.getPaymentMethod().toUpperCase()
                : "COD";
        Payment payment = Payment.builder()
                .order(savedOrder)
                .amount(total)
                .paymentMethod(method)
                .status(PaymentStatus.PENDING)
                .build();
        payment = paymentRepository.save(payment);
        savedOrder.setPayment(payment);

        // Empty the cart now that the order has been placed.
        cart.getItems().clear();
        cartRepository.save(cart);

        emailService.sendOrderConfirmationEmail(user.getEmail(), savedOrder.getOrderNumber());

        return toResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Page<Order> page = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrder(String email, Long orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Order not found");
        }
        return toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByIdentifier(String email, String identifier) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Order order = null;
        try {
            Long orderId = Long.parseLong(identifier);
            order = orderRepository.findByIdAndUserId(orderId, user.getId()).orElse(null);
        } catch (NumberFormatException ignored) {}

        if (order == null) {
            order = orderRepository.findByOrderNumberAndUserId(identifier, user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + identifier));
        }

        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(String email, Long orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Order not found");
        }
        if (!CANCELLABLE.contains(order.getStatus())) {
            throw new BadRequestException("This order can no longer be cancelled");
        }

        order.setStatus(OrderStatus.CANCELLED);
        Payment cancelPayment = order.getPayment();
        if (cancelPayment != null) {
            if (cancelPayment.getStatus() == PaymentStatus.SUCCESS) {
                cancelPayment.setStatus(PaymentStatus.REFUNDED);
            } else if (cancelPayment.getStatus() == PaymentStatus.PENDING) {
                cancelPayment.setStatus(PaymentStatus.FAILED);
            }
            paymentRepository.save(cancelPayment);
        }
        // restore inventory
        for (OrderItem item : order.getItems()) {
            Inventory inv = item.getProduct().getInventory();
            if (inv != null) {
                inv.setStockQuantity(inv.getStockQuantity() + item.getQuantity());
                inventoryRepository.save(inv);
            }
            item.setItemStatus(OrderStatus.CANCELLED);
        }
        orderRepository.save(order);
        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setStatus(status);
        order.getItems().forEach(i -> i.setItemStatus(status));

        // When order is DELIVERED, COD or pending payment is marked SUCCESS
        if (status == OrderStatus.DELIVERED) {
            Payment payment = order.getPayment();
            if (payment == null) {
                payment = Payment.builder()
                        .order(order)
                        .amount(order.getTotal())
                        .paymentMethod("COD")
                        .status(PaymentStatus.SUCCESS)
                        .build();
                payment = paymentRepository.save(payment);
                order.setPayment(payment);
            } else {
                payment.setStatus(PaymentStatus.SUCCESS);
                paymentRepository.save(payment);
            }
        } else if (status == OrderStatus.CANCELLED) {
            Payment payment = order.getPayment();
            if (payment != null) {
                if (payment.getStatus() == PaymentStatus.SUCCESS) {
                    payment.setStatus(PaymentStatus.REFUNDED);
                } else if (payment.getStatus() == PaymentStatus.PENDING) {
                    payment.setStatus(PaymentStatus.FAILED);
                }
                paymentRepository.save(payment);
            }
        }

        orderRepository.save(order);
        emailService.sendShippingUpdateEmail(order.getUser().getEmail(), order.getOrderNumber(), status.name());
        return toResponse(order);
    }

    @Override
    public OrderResponse toResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getItems() != null
                ? order.getItems().stream()
                .map(i -> OrderResponse.OrderItemResponse.builder()
                        .id(i.getId())
                        .productName(i.getProductNameSnapshot())
                        .price(i.getPriceSnapshot())
                        .quantity(i.getQuantity())
                        .itemStatus(i.getItemStatus())
                        .build())
                .toList()
                : List.of();

        String addressStr = null;
        if (order.getDeliveryAddress() != null) {
            Address a = order.getDeliveryAddress();
            addressStr = String.format("%s, %s, %s, %s - %s", a.getLine1(), a.getLine2() != null ? a.getLine2() : "", a.getCity(), a.getState(), a.getPostalCode()).replace(", ,", ",");
        }

        OrderResponse.PaymentResponse paymentResponse = null;
        String paymentStatusStr = null;
        String paymentScreenshotUrl = null;
        String paymentMethod = null;

        if (order.getPayment() != null) {
            Payment p = order.getPayment();
            paymentStatusStr = p.getStatus() != null ? p.getStatus().name() : null;
            paymentScreenshotUrl = p.getScreenshotUrl();
            paymentMethod = p.getPaymentMethod();
            paymentResponse = OrderResponse.PaymentResponse.builder()
                    .id(p.getId())
                    .razorpayOrderId(p.getRazorpayOrderId())
                    .razorpayPaymentId(p.getRazorpayPaymentId())
                    .paymentMethod(p.getPaymentMethod())
                    .screenshotUrl(p.getScreenshotUrl())
                    .amount(p.getAmount())
                    .status(p.getStatus())
                    .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null)
                    .build();
        } else {
            paymentMethod = "COD";
            paymentStatusStr = (order.getStatus() == OrderStatus.DELIVERED) ? PaymentStatus.SUCCESS.name()
                    : (order.getStatus() == OrderStatus.CANCELLED) ? PaymentStatus.FAILED.name()
                    : PaymentStatus.PENDING.name();
            paymentResponse = OrderResponse.PaymentResponse.builder()
                    .paymentMethod(paymentMethod)
                    .amount(order.getTotal())
                    .status(PaymentStatus.valueOf(paymentStatusStr))
                    .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null)
                    .build();
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerName(order.getUser() != null ? order.getUser().getFullName() : "Customer")
                .customerEmail(order.getUser() != null ? order.getUser().getEmail() : "")
                .deliveryAddress(addressStr)
                .status(order.getStatus())
                .subtotal(order.getSubtotal())
                .deliveryCharge(order.getDeliveryCharge())
                .discount(order.getDiscount())
                .total(order.getTotal())
                .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null)
                .items(items)
                .payment(paymentResponse)
                .paymentStatus(paymentStatusStr)
                .paymentScreenshotUrl(paymentScreenshotUrl)
                .paymentMethod(paymentMethod)
                .build();
    }
}

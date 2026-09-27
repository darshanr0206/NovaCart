package com.novacart.service;

import com.novacart.dto.response.PageResponse;
import com.novacart.entity.Notification;
import com.novacart.entity.User;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    Notification sendNotification(User user, String title, String message);
    PageResponse<Notification> getMyNotifications(String email, Pageable pageable);
    void markAsRead(String email, Long notificationId);
    void markAllAsRead(String email);
    long getUnreadCount(String email);
}

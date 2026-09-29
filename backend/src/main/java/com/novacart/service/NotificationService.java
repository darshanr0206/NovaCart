package com.novacart.service;

import com.novacart.dto.response.NotificationResponse;
import com.novacart.dto.response.PageResponse;
import com.novacart.entity.Notification;
import com.novacart.entity.User;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {
    Notification sendNotification(User user, String title, String message, String type, String link);
    PageResponse<NotificationResponse> getMyNotifications(String email, Pageable pageable);
    List<NotificationResponse> getRecentNotifications(String email);
    long getUnreadCount(String email);
    void markAsRead(String email, Long id);
    void markAllAsRead(String email);
    NotificationResponse toResponse(Notification notification);
}

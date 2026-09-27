package com.novacart.service.impl;

import com.novacart.dto.response.PageResponse;
import com.novacart.entity.Notification;
import com.novacart.entity.User;
import com.novacart.exception.ResourceNotFoundException;
import com.novacart.repository.NotificationRepository;
import com.novacart.repository.UserRepository;
import com.novacart.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Notification sendNotification(User user, String title, String message) {
        if (user == null) return null;
        Notification n = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(n);
        log.info("Sent notification #{} to user {}: {}", saved.getId(), user.getEmail(), title);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<Notification> getMyNotifications(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        Page<Notification> page = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        return PageResponse.of(page);
    }

    @Override
    @Transactional
    public void markAsRead(String email, Long notificationId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        if (n.getUser().getId().equals(user.getId())) {
            n.setRead(true);
            notificationRepository.save(n);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(user.getId());
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return 0;
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }
}

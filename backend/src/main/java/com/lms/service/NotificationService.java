package com.lms.service;

import com.lms.dto.NotificationDto;
import com.lms.dto.UnreadCountDto;
import com.lms.entity.Notification;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.NotificationRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    public static final String TYPE_ENROLLMENT = "ENROLLMENT";
    public static final String TYPE_QUIZ_PASSED = "QUIZ_PASSED";
    public static final String TYPE_CERTIFICATE = "CERTIFICATE";

    private final NotificationRepository notificationRepository;
    private final CurrentUserService currentUserService;

    public NotificationService(NotificationRepository notificationRepository,
                               CurrentUserService currentUserService) {
        this.notificationRepository = notificationRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> myNotifications(Authentication authentication) {
        User user = currentUserService.get(authentication);
        return notificationRepository.findByUserIdOrderByCreatedAtDescIdDesc(user.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountDto unreadCount(Authentication authentication) {
        User user = currentUserService.get(authentication);
        return new UnreadCountDto(notificationRepository.countByUserIdAndReadFlagFalse(user.getId()));
    }

    @Transactional
    public NotificationDto markRead(Long notificationId, Authentication authentication) {
        User user = currentUserService.get(authentication);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw ApiException.forbidden("You can only read your own notifications");
        }
        if (!notification.isReadFlag()) {
            notification.setReadFlag(true);
            notification = notificationRepository.save(notification);
        }
        return toDto(notification);
    }

    @Transactional
    public UnreadCountDto markAllRead(Authentication authentication) {
        User user = currentUserService.get(authentication);
        notificationRepository.markAllRead(user.getId());
        return new UnreadCountDto(0);
    }

    @Transactional
    public void notify(User user, String message, String type) {
        if (user == null || message == null || message.isBlank()) {
            return;
        }
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReadFlag(false);
        notificationRepository.save(notification);
    }

    private NotificationDto toDto(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getMessage(),
                notification.getType(),
                notification.isReadFlag(),
                notification.getCreatedAt()
        );
    }
}

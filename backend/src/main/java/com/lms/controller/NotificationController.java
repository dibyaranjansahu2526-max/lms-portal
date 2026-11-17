package com.lms.controller;

import com.lms.dto.NotificationDto;
import com.lms.dto.UnreadCountDto;
import com.lms.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationDto> myNotifications(Authentication authentication) {
        return notificationService.myNotifications(authentication);
    }

    @GetMapping("/unread-count")
    public UnreadCountDto unreadCount(Authentication authentication) {
        return notificationService.unreadCount(authentication);
    }

    @PutMapping("/{notificationId}/read")
    public NotificationDto markRead(@PathVariable Long notificationId, Authentication authentication) {
        return notificationService.markRead(notificationId, authentication);
    }

    @PutMapping("/read-all")
    public UnreadCountDto markAllRead(Authentication authentication) {
        return notificationService.markAllRead(authentication);
    }
}

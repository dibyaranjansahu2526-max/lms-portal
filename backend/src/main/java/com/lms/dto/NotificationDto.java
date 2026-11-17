package com.lms.dto;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String message,
        String type,
        boolean read,
        LocalDateTime createdAt
) {
}

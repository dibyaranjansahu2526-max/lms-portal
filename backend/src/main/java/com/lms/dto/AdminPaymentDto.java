package com.lms.dto;

import java.time.LocalDateTime;

public record AdminPaymentDto(
        Long id,
        String studentName,
        String studentEmail,
        Long courseId,
        String courseTitle,
        long amountPaise,
        String status,
        LocalDateTime createdAt
) {
}
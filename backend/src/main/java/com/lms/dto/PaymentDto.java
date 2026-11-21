package com.lms.dto;

import java.time.LocalDateTime;

public record PaymentDto(
        Long id,
        String razorpayOrderId,
        String razorpayPaymentId,
        Long courseId,
        String courseTitle,
        long amountPaise,
        String status,
        LocalDateTime createdAt
) {
}
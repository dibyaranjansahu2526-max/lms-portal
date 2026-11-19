package com.lms.dto;

public record PaymentVerificationDto(
        String status,
        String razorpayOrderId,
        String razorpayPaymentId,
        Long courseId,
        Long enrollmentId
) {
}

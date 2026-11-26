package com.lms.dto;

public record PaymentOrderDto(
        String orderId,
        long amount,
        String currency,
        String keyId,
        boolean directEnrollment,
        Long enrollmentId,
        String couponCode,
        Integer discountPercent,
        long originalAmountPaise,
        long discountPaise,
        long finalAmountPaise
) {
}
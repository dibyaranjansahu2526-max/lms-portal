package com.lms.dto;

public record PaymentOrderDto(
        String orderId,
        long amount,
        String currency,
        String keyId
) {
}

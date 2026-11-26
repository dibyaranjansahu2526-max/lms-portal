package com.lms.dto;

public record CouponValidationDto(
        String code,
        int discountPercent,
        long originalPricePaise,
        long discountPaise,
        long finalPricePaise,
        boolean free
) {
}
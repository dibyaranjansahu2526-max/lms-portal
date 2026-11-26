package com.lms.dto;

import java.time.LocalDateTime;

public record CouponDto(
        Long id,
        String code,
        int discountPercent,
        LocalDateTime expiresAt,
        int maxUses,
        int usedCount,
        boolean active,
        int remainingUses
) {
}
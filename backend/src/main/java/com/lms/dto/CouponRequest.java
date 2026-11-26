package com.lms.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CouponRequest(
        @NotBlank(message = "Coupon code is required")
        @Size(max = 40, message = "Coupon code must be 40 characters or fewer")
        String code,

        @NotNull(message = "Discount percentage is required")
        @Min(value = 1, message = "Discount must be at least 1 percent")
        @Max(value = 100, message = "Discount cannot exceed 100 percent")
        Integer discountPercent,

        @NotNull(message = "Expiry date is required")
        LocalDateTime expiresAt,

        @NotNull(message = "Maximum uses is required")
        @Min(value = 1, message = "Maximum uses must be at least 1")
        Integer maxUses,

        Boolean active
) {
}
package com.lms.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CouponValidationRequest(
        @JsonAlias("course_id")
        @NotNull(message = "Course id is required")
        Long courseId,

        @JsonAlias({"couponCode", "coupon_code"})
        @NotBlank(message = "Coupon code is required")
        String code
) {
}
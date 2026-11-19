package com.lms.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;

public record CreatePaymentOrderRequest(
        @JsonAlias("course_id")
        @NotNull(message = "Course id is required")
        Long courseId
) {
}

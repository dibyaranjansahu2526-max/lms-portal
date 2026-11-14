package com.lms.dto;

import jakarta.validation.constraints.NotNull;

public record MockAnswerRequest(
        @NotNull(message = "Choose an option")
        Long optionId
) {
}

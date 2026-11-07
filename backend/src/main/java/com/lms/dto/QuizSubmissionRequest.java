package com.lms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record QuizSubmissionRequest(
        @NotEmpty(message = "Answers are required")
        @Valid
        List<Answer> answers
) {
    public record Answer(
            @NotNull(message = "Question id is required")
            Long questionId,

            @NotNull(message = "Option id is required")
            Long optionId
    ) {
    }
}

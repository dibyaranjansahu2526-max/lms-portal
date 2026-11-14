package com.lms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MockSubmissionRequest(
        @Valid
        @Size(max = 500, message = "Too many answers")
        List<AnswerRequest> answers
) {
    public record AnswerRequest(
            @NotNull(message = "Question id is required")
            Long questionId,

            @NotNull(message = "Option id is required")
            Long optionId
    ) {
    }
}

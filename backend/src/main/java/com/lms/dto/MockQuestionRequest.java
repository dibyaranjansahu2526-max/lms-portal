package com.lms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MockQuestionRequest(
        @NotBlank(message = "Question text is required")
        @Size(max = 1000, message = "Question text is too long")
        String text,

        @NotNull(message = "Add exactly four options")
        @Size(min = 4, max = 4, message = "Every question must have exactly four options")
        @Valid
        List<OptionRequest> options
) {
    public record OptionRequest(
            @NotBlank(message = "Option text is required")
            @Size(max = 500, message = "Option text is too long")
            String text,

            boolean correct
    ) {
    }
}

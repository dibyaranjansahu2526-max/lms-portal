package com.lms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record QuizRequest(
        @NotBlank(message = "Quiz title is required")
        @Size(max = 180, message = "Title must be at most 180 characters")
        String title,

        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,

        @Min(value = 1, message = "Passing score must be at least 1")
        @Max(value = 100, message = "Passing score must be at most 100")
        Integer passingScore,

        @NotEmpty(message = "Add at least one question")
        @Valid
        List<QuestionRequest> questions
) {
    public record QuestionRequest(
            @NotBlank(message = "Question text is required")
            @Size(max = 1000, message = "Question text is too long")
            String text,

            @NotEmpty(message = "Add at least two options")
            @Size(min = 2, message = "Add at least two options")
            @Valid
            List<OptionRequest> options
    ) {
    }

    public record OptionRequest(
            @NotBlank(message = "Option text is required")
            @Size(max = 500, message = "Option text is too long")
            String text,

            boolean correct
    ) {
    }
}

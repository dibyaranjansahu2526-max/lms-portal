package com.lms.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MockTestRequest(
        @NotBlank(message = "Test title is required")
        @Size(max = 180, message = "Title must be at most 180 characters")
        String title,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        @NotBlank(message = "Category is required")
        @Size(max = 100, message = "Category must be at most 100 characters")
        String category,

        @NotNull(message = "Duration is required")
        @Min(value = 1, message = "Duration must be at least 1 minute")
        @Max(value = 600, message = "Duration must be at most 600 minutes")
        Integer durationMinutes,

        @NotNull(message = "Total marks are required")
        @DecimalMin(value = "0.01", message = "Total marks must be greater than zero")
        Double totalMarks,

        @NotNull(message = "Marks per correct answer are required")
        @DecimalMin(value = "0.01", message = "Marks per correct answer must be greater than zero")
        Double marksPerCorrect,

        @DecimalMin(value = "0.0", message = "Negative marks cannot be negative")
        Double negativeMarks,

        Boolean published
) {
}

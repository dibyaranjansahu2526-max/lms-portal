package com.lms.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LessonRequest(
        @NotBlank(message = "Lesson title is required")
        @Size(max = 180, message = "Title must be at most 180 characters")
        String title,

        @NotBlank(message = "Lesson content is required")
        String content,

        @Size(max = 500, message = "Video URL must be at most 500 characters")
        String videoUrl,

        @Size(max = 500, message = "Material URL must be at most 500 characters")
        String materialUrl,

        @NotNull(message = "Lesson order is required")
        @Min(value = 1, message = "Lesson order must be at least 1")
        Integer order
) {
}

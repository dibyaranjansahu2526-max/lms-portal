package com.lms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CourseRequest(
        @NotBlank(message = "Course title is required")
        @Size(max = 180, message = "Title must be at most 180 characters")
        String title,

        @NotBlank(message = "Course description is required")
        @Size(max = 4000, message = "Description must be at most 4000 characters")
        String description,

        @Size(max = 100, message = "Category must be at most 100 characters")
        String category,

        @Size(max = 500, message = "Image URL must be at most 500 characters")
        String imageUrl,

        boolean published
) {
}

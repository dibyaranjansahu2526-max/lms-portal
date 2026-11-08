package com.lms.dto;

import java.time.LocalDateTime;

public record WishlistDto(
        Long id,
        CourseDto course,
        LocalDateTime createdAt
) {
}

package com.lms.dto;

import java.time.LocalDateTime;

public record ReviewDto(
        Long id,
        String studentName,
        int rating,
        String comment,
        LocalDateTime createdAt,
        boolean mine
) {
}

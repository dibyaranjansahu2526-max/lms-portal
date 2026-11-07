package com.lms.dto;

import java.time.LocalDateTime;

public record CourseDto(
        Long id,
        String title,
        String description,
        String category,
        String imageUrl,
        boolean published,
        Long teacherId,
        String teacherName,
        long lessonCount,
        long quizCount,
        long enrollmentCount,
        LocalDateTime createdAt
) {
}

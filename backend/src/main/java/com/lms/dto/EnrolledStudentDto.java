package com.lms.dto;

import java.time.LocalDateTime;

public record EnrolledStudentDto(
        Long studentId,
        String name,
        String email,
        LocalDateTime enrolledAt,
        boolean completed,
        int progressPercentage,
        int completedLessons,
        int totalLessons
) {
}

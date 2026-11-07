package com.lms.dto;

import java.time.LocalDateTime;

public record ProgressDto(
        int totalLessons,
        int completedLessons,
        int totalQuizzes,
        int passedQuizzes,
        int percentage,
        boolean allLessonsCompleted,
        boolean allQuizzesPassed,
        boolean completed,
        String certificateCode,
        LocalDateTime completedAt
) {
}

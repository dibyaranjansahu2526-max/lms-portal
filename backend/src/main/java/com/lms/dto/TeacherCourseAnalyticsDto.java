package com.lms.dto;

public record TeacherCourseAnalyticsDto(
        Long courseId,
        String title,
        boolean published,
        long enrollmentCount,
        long completedCount,
        double completionRate,
        Double averageQuizScore,
        long quizAttemptCount
) {
}

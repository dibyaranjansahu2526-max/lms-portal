package com.lms.dto;

public record AdminStatsDto(
        long totalUsers,
        long totalStudents,
        long totalTeachers,
        long totalCourses,
        long publishedCourses,
        long totalEnrollments,
        long totalLessons,
        long totalQuizzes
) {
}

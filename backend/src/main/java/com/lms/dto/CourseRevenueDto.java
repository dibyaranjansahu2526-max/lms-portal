package com.lms.dto;

public record CourseRevenueDto(
        Long courseId,
        String courseTitle,
        long revenuePaise,
        long successfulPayments
) {
}
package com.lms.dto;

import java.time.LocalDateTime;

public record EnrolledCourseDto(
        Long enrollmentId,
        CourseDto course,
        LocalDateTime enrolledAt,
        ProgressDto progress
) {
}

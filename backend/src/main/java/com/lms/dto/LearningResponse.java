package com.lms.dto;

import java.util.List;

public record LearningResponse(
        CourseDto course,
        List<LessonDto> lessons,
        List<StudentQuizSummaryDto> quizzes,
        ProgressDto progress
) {
}

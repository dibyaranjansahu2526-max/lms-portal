package com.lms.dto;

public record QuizResultDto(
        Long attemptId,
        int score,
        boolean passed,
        int passingScore,
        int correctAnswers,
        int totalQuestions,
        boolean courseCompleted,
        String certificateCode
) {
}

package com.lms.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MockResultDto(
        Long attemptId,
        Long testId,
        String testTitle,
        String category,
        double score,
        double totalMarks,
        double percentage,
        int correctCount,
        int wrongCount,
        int unansweredCount,
        int totalQuestions,
        long timeTakenSeconds,
        LocalDateTime startedAt,
        LocalDateTime submittedAt,
        boolean passed,
        String status,
        List<AnswerReviewDto> answers
) {
    public record AnswerReviewDto(
            Long questionId,
            String questionText,
            int order,
            String studentAnswer,
            String correctAnswer,
            boolean correct,
            boolean answered,
            double marksAwarded
    ) {
    }
}

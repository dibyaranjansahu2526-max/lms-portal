package com.lms.dto;

import java.time.LocalDateTime;

public record MockAttemptSummaryDto(
        Long attemptId,
        double score,
        double totalMarks,
        double percentage,
        int correctCount,
        int wrongCount,
        int unansweredCount,
        int totalQuestions,
        long timeTakenSeconds,
        LocalDateTime submittedAt,
        String status,
        boolean passed
) {
}

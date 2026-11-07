package com.lms.dto;

public record StudentQuizSummaryDto(
        Long id,
        String title,
        String description,
        int passingScore,
        int questionCount,
        boolean passed,
        Integer lastScore
) {
}

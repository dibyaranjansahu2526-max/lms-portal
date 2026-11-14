package com.lms.dto;

public record StudentMockTestDto(
        Long id,
        String title,
        String description,
        String category,
        int durationMinutes,
        double totalMarks,
        double marksPerCorrect,
        double negativeMarks,
        int questionCount,
        Double bestScore,
        long attemptCount
) {
}

package com.lms.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MockStartDto(
        Long attemptId,
        Long testId,
        String title,
        String description,
        String category,
        int durationMinutes,
        double totalMarks,
        double marksPerCorrect,
        double negativeMarks,
        LocalDateTime startedAt,
        LocalDateTime expiresAt,
        long remainingSeconds,
        List<QuestionDto> questions,
        List<SavedAnswerDto> savedAnswers
) {
    public record QuestionDto(
            Long id,
            String text,
            int order,
            List<OptionDto> options
    ) {
    }

    public record OptionDto(
            Long id,
            String text
    ) {
    }

    public record SavedAnswerDto(
            Long questionId,
            Long optionId
    ) {
    }
}

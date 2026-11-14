package com.lms.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MockTestDto(
        Long id,
        String title,
        String description,
        String category,
        int durationMinutes,
        double totalMarks,
        double marksPerCorrect,
        double negativeMarks,
        boolean published,
        LocalDateTime createdAt,
        int questionCount,
        long attemptCount,
        List<QuestionDto> questions
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
            String text,
            boolean correct
    ) {
    }
}

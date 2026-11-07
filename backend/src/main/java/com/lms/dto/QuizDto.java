package com.lms.dto;

import java.util.List;

public record QuizDto(
        Long id,
        String title,
        String description,
        int passingScore,
        Long courseId,
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

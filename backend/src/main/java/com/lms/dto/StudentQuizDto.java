package com.lms.dto;

import java.util.List;

public record StudentQuizDto(
        Long id,
        String title,
        String description,
        int passingScore,
        Long courseId,
        String courseTitle,
        boolean alreadyPassed,
        Integer lastScore,
        List<QuestionDto> questions
) {
    public record QuestionDto(
            Long id,
            String text,
            List<OptionDto> options
    ) {
    }

    public record OptionDto(
            Long id,
            String text
    ) {
    }
}

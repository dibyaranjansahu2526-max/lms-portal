package com.lms.dto;

public record LessonDto(
        Long id,
        String title,
        String content,
        String videoUrl,
        String materialUrl,
        int order,
        boolean completed
) {
}

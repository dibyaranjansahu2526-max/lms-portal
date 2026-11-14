package com.lms.dto;

import java.util.List;

public record MockHistoryDto(
        Long testId,
        String testTitle,
        String category,
        double totalMarks,
        int durationMinutes,
        List<MockAttemptSummaryDto> attempts
) {
}

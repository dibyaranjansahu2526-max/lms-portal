package com.lms.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MockLeaderboardDto(
        Long testId,
        String testTitle,
        String category,
        double totalMarks,
        List<Entry> entries
) {
    public record Entry(
            int rank,
            String studentName,
            double score,
            double totalMarks,
            double percentage,
            long timeTakenSeconds,
            LocalDateTime submittedAt
    ) {
    }
}

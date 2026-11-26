package com.lms.dto;

import java.time.LocalDate;

public record DailyRevenueDto(
        LocalDate date,
        long revenuePaise
) {
}
package com.lms.dto;

public record AdminRevenueSummaryDto(
        long totalRevenuePaise,
        long successfulPayments
) {
}
package com.lms.dto;

import java.util.List;

public record AdminRevenueDto(
        long totalRevenuePaise,
        long successfulPayments,
        List<CourseRevenueDto> revenueByCourse,
        List<DailyRevenueDto> revenueByDay,
        List<AdminPaymentDto> recentPayments
) {
}
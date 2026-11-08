package com.lms.dto;

import java.util.List;

public record ReviewSummaryDto(
        double averageRating,
        long reviewCount,
        List<ReviewDto> reviews,
        ReviewDto myReview
) {
}

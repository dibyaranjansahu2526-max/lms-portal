package com.lms.dto;

import java.util.List;

public record CoursePageDto(
        List<CourseDto> content,
        int totalPages,
        long totalElements
) {
}

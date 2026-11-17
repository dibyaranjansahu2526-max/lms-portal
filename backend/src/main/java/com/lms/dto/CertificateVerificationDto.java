package com.lms.dto;

import java.time.LocalDate;

public record CertificateVerificationDto(
        String studentName,
        String courseName,
        LocalDate issueDate
) {
}

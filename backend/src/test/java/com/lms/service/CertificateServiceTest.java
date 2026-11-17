package com.lms.service;

import com.lms.dto.CertificateVerificationDto;
import com.lms.entity.Course;
import com.lms.entity.Enrollment;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.EnrollmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private EnrollmentService enrollmentService;

    @Mock
    private CourseService courseService;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private CertificateService certificateService;

    @Test
    void verifyReturnsStudentCourseAndIssueDateForValidCode() {
        Enrollment enrollment = completedEnrollment();
        when(enrollmentRepository.findByCertificateCode("LMS-ABC123")).thenReturn(Optional.of(enrollment));

        CertificateVerificationDto result = certificateService.verify(" lms-abc123 ");

        assertThat(result.studentName()).isEqualTo("Ada Lovelace");
        assertThat(result.courseName()).isEqualTo("Java Spring Boot Masterclass");
        assertThat(result.issueDate()).isEqualTo(LocalDate.of(2026, 11, 17));
    }

    @Test
    void verifyThrowsNotFoundForUnknownCode() {
        when(enrollmentRepository.findByCertificateCode("LMS-UNKNOWN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> certificateService.verify("LMS-UNKNOWN"))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> assertThat(((ApiException) error).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void verifyThrowsNotFoundForBlankCodeWithoutQuerying() {
        assertThatThrownBy(() -> certificateService.verify("   "))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> assertThat(((ApiException) error).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

        verifyNoInteractions(enrollmentRepository);
    }

    @Test
    void verifyThrowsNotFoundWhenCertificateIsNotCompleted() {
        Enrollment enrollment = completedEnrollment();
        enrollment.setCompleted(false);
        when(enrollmentRepository.findByCertificateCode("LMS-ABC123")).thenReturn(Optional.of(enrollment));

        assertThatThrownBy(() -> certificateService.verify("LMS-ABC123"))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> assertThat(((ApiException) error).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    private Enrollment completedEnrollment() {
        User student = new User();
        student.setName("Ada Lovelace");

        Course course = new Course();
        course.setTitle("Java Spring Boot Masterclass");

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setCompleted(true);
        enrollment.setCompletedAt(LocalDateTime.of(2026, 11, 17, 10, 30));
        enrollment.setCertificateCode("LMS-ABC123");
        return enrollment;
    }
}

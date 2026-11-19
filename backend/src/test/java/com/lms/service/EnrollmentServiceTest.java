package com.lms.service;

import com.lms.dto.EnrolledCourseDto;
import com.lms.entity.Course;
import com.lms.entity.Enrollment;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.LessonProgressRepository;
import com.lms.repository.LessonRepository;
import com.lms.repository.QuizAttemptRepository;
import com.lms.repository.QuizRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    private static final long STUDENT_ID = 12L;
    private static final long COURSE_ID = 24L;
    private static final long ENROLLMENT_ID = 48L;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private LessonProgressRepository lessonProgressRepository;

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private CourseService courseService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private EnrollmentService enrollmentService;

    private User student;
    private Course course;

    @BeforeEach
    void setUp() {
        student = new User();
        student.setId(STUDENT_ID);
        student.setName("Test Student");
        student.setEmail("student@example.com");
        student.setRole(Role.STUDENT);

        course = new Course();
        course.setId(COURSE_ID);
        course.setTitle("Paid Course");
        course.setPrice(499L);
        course.setPublished(true);
    }

    @Test
    void freeEnrollmentIsBlockedForPaidCourses() {
        when(currentUserService.get(authentication)).thenReturn(student);
        when(courseService.findCourse(COURSE_ID)).thenReturn(course);

        assertThatThrownBy(() -> enrollmentService.enroll(COURSE_ID, authentication))
                .isInstanceOf(ApiException.class)
                .hasMessage("This course requires payment. Complete checkout before enrolling.");

        verify(enrollmentRepository, never()).save(any(Enrollment.class));
        verifyNoInteractions(notificationService);
    }

    @Test
    void enrollingAfterPaymentIsIdempotent() {
        stubEmptyProgress();
        when(courseService.toDto(course)).thenReturn(null);
        when(enrollmentRepository.findByStudentIdAndCourseId(STUDENT_ID, COURSE_ID))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(existingEnrollment()));
        when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(invocation -> {
            Enrollment enrollment = invocation.getArgument(0);
            enrollment.setId(ENROLLMENT_ID);
            enrollment.setEnrolledAt(LocalDateTime.now());
            return enrollment;
        });

        EnrolledCourseDto first = enrollmentService.enrollAfterPayment(course, student);
        EnrolledCourseDto second = enrollmentService.enrollAfterPayment(course, student);

        assertThat(first.enrollmentId()).isEqualTo(ENROLLMENT_ID);
        assertThat(second.enrollmentId()).isEqualTo(ENROLLMENT_ID);
        verify(enrollmentRepository, times(1)).save(any(Enrollment.class));
        verify(notificationService, times(1))
                .notify(eq(student), contains("enrolled"), eq(NotificationService.TYPE_ENROLLMENT));
    }

    private void stubEmptyProgress() {
        when(lessonRepository.findByCourseIdOrderByLessonOrderAsc(COURSE_ID)).thenReturn(List.of());
        when(lessonProgressRepository.countByStudentIdAndLessonCourseIdAndCompletedTrue(STUDENT_ID, COURSE_ID))
                .thenReturn(0L);
        when(quizRepository.findByCourseIdOrderByIdAsc(COURSE_ID)).thenReturn(List.of());
        when(quizAttemptRepository.findPassedQuizIds(STUDENT_ID, COURSE_ID)).thenReturn(List.of());
    }

    private Enrollment existingEnrollment() {
        Enrollment enrollment = new Enrollment();
        enrollment.setId(ENROLLMENT_ID);
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setEnrolledAt(LocalDateTime.now());
        return enrollment;
    }
}

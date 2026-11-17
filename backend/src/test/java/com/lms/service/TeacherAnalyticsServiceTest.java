package com.lms.service;

import com.lms.dto.TeacherCourseAnalyticsDto;
import com.lms.entity.Course;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.repository.CourseRepository;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.QuizAttemptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherAnalyticsServiceTest {

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private TeacherAnalyticsService teacherAnalyticsService;

    private User teacher;
    private Course course;

    @BeforeEach
    void setUp() {
        teacher = new User();
        teacher.setId(2L);
        teacher.setName("Test Teacher");
        teacher.setEmail("teacher@example.com");
        teacher.setRole(Role.TEACHER);

        course = new Course();
        course.setId(1L);
        course.setTitle("Java Course");
        course.setPublished(true);

        when(currentUserService.get(authentication)).thenReturn(teacher);
    }

    @Test
    void aggregatesEnrollmentAndQuizStatsForTeachersCoursesOnly() {
        EnrollmentRepository.CourseEnrollmentStats enrollmentStats =
                mock(EnrollmentRepository.CourseEnrollmentStats.class);
        when(enrollmentStats.getCourseId()).thenReturn(1L);
        when(enrollmentStats.getEnrollmentCount()).thenReturn(4L);
        when(enrollmentStats.getCompletedCount()).thenReturn(1L);

        QuizAttemptRepository.CourseQuizStats quizStats =
                mock(QuizAttemptRepository.CourseQuizStats.class);
        when(quizStats.getCourseId()).thenReturn(1L);
        when(quizStats.getAverageScore()).thenReturn(72.34);
        when(quizStats.getAttemptCount()).thenReturn(3L);

        when(enrollmentRepository.findCourseStatsByTeacherId(2L)).thenReturn(List.of(enrollmentStats));
        when(quizAttemptRepository.findCourseStatsByTeacherId(2L)).thenReturn(List.of(quizStats));
        when(courseRepository.findByTeacherIdOrderByCreatedAtDesc(2L)).thenReturn(List.of(course));

        List<TeacherCourseAnalyticsDto> result = teacherAnalyticsService.courseAnalytics(authentication);

        assertThat(result).hasSize(1);
        TeacherCourseAnalyticsDto row = result.get(0);
        assertThat(row.courseId()).isEqualTo(1L);
        assertThat(row.enrollmentCount()).isEqualTo(4);
        assertThat(row.completedCount()).isEqualTo(1);
        assertThat(row.completionRate()).isEqualTo(25.0);
        assertThat(row.averageQuizScore()).isEqualTo(72.3);
        assertThat(row.quizAttemptCount()).isEqualTo(3);
    }

    @Test
    void returnsZeroesWhenCourseHasNoActivity() {
        when(enrollmentRepository.findCourseStatsByTeacherId(2L)).thenReturn(List.of());
        when(quizAttemptRepository.findCourseStatsByTeacherId(2L)).thenReturn(List.of());
        when(courseRepository.findByTeacherIdOrderByCreatedAtDesc(2L)).thenReturn(List.of(course));

        TeacherCourseAnalyticsDto row = teacherAnalyticsService.courseAnalytics(authentication).get(0);

        assertThat(row.enrollmentCount()).isZero();
        assertThat(row.completedCount()).isZero();
        assertThat(row.completionRate()).isZero();
        assertThat(row.averageQuizScore()).isNull();
        assertThat(row.quizAttemptCount()).isZero();
    }
}

package com.lms.service;

import com.lms.dto.TeacherCourseAnalyticsDto;
import com.lms.entity.Course;
import com.lms.entity.User;
import com.lms.repository.CourseRepository;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.QuizAttemptRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TeacherAnalyticsService {

    private final CurrentUserService currentUserService;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public TeacherAnalyticsService(CurrentUserService currentUserService,
                                   CourseRepository courseRepository,
                                   EnrollmentRepository enrollmentRepository,
                                   QuizAttemptRepository quizAttemptRepository) {
        this.currentUserService = currentUserService;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.quizAttemptRepository = quizAttemptRepository;
    }

    @Transactional(readOnly = true)
    public List<TeacherCourseAnalyticsDto> courseAnalytics(Authentication authentication) {
        User teacher = currentUserService.get(authentication);

        Map<Long, EnrollmentRepository.CourseEnrollmentStats> enrollmentStats = enrollmentRepository
                .findCourseStatsByTeacherId(teacher.getId())
                .stream()
                .collect(Collectors.toMap(
                        EnrollmentRepository.CourseEnrollmentStats::getCourseId,
                        Function.identity()
                ));

        Map<Long, QuizAttemptRepository.CourseQuizStats> quizStats = quizAttemptRepository
                .findCourseStatsByTeacherId(teacher.getId())
                .stream()
                .collect(Collectors.toMap(
                        QuizAttemptRepository.CourseQuizStats::getCourseId,
                        Function.identity()
                ));

        return courseRepository.findByTeacherIdOrderByCreatedAtDesc(teacher.getId())
                .stream()
                .map(course -> toDto(course, enrollmentStats.get(course.getId()), quizStats.get(course.getId())))
                .toList();
    }

    private TeacherCourseAnalyticsDto toDto(Course course,
                                            EnrollmentRepository.CourseEnrollmentStats enrollment,
                                            QuizAttemptRepository.CourseQuizStats quiz) {
        long enrollmentCount = enrollment == null ? 0 : enrollment.getEnrollmentCount();
        long completedCount = enrollment == null ? 0 : enrollment.getCompletedCount();
        double completionRate = enrollmentCount == 0
                ? 0.0
                : roundToOneDecimal(completedCount * 100.0 / enrollmentCount);

        Double averageQuizScore = quiz == null || quiz.getAverageScore() == null
                ? null
                : roundToOneDecimal(quiz.getAverageScore());
        long quizAttemptCount = quiz == null ? 0 : quiz.getAttemptCount();

        return new TeacherCourseAnalyticsDto(
                course.getId(),
                course.getTitle(),
                course.isPublished(),
                enrollmentCount,
                completedCount,
                completionRate,
                averageQuizScore,
                quizAttemptCount
        );
    }

    private double roundToOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}

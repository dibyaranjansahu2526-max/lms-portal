package com.lms.service;

import com.lms.dto.CourseDto;
import com.lms.dto.EnrolledCourseDto;
import com.lms.dto.EnrolledStudentDto;
import com.lms.dto.LearningResponse;
import com.lms.dto.LessonDto;
import com.lms.dto.ProgressDto;
import com.lms.dto.StudentQuizSummaryDto;
import com.lms.entity.Course;
import com.lms.entity.Enrollment;
import com.lms.entity.Lesson;
import com.lms.entity.LessonProgress;
import com.lms.entity.Quiz;
import com.lms.entity.QuizAttempt;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.LessonProgressRepository;
import com.lms.repository.LessonRepository;
import com.lms.repository.QuizAttemptRepository;
import com.lms.repository.QuizRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CourseService courseService;
    private final CurrentUserService currentUserService;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             LessonRepository lessonRepository,
                             LessonProgressRepository lessonProgressRepository,
                             QuizRepository quizRepository,
                             QuizAttemptRepository quizAttemptRepository,
                             CourseService courseService,
                             CurrentUserService currentUserService) {
        this.enrollmentRepository = enrollmentRepository;
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.quizRepository = quizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.courseService = courseService;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public EnrolledCourseDto enroll(Long courseId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Course course = courseService.findCourse(courseId);
        if (!course.isPublished()) {
            throw ApiException.badRequest("This course is not open for enrollment");
        }
        if (enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), courseId)) {
            throw ApiException.conflict("You are already enrolled in this course");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setCompleted(false);
        enrollment = enrollmentRepository.save(enrollment);

        return new EnrolledCourseDto(
                enrollment.getId(),
                courseService.toDto(course),
                enrollment.getEnrolledAt(),
                calculateProgress(student, course, enrollment)
        );
    }

    @Transactional
    public List<EnrolledCourseDto> myCourses(Authentication authentication) {
        User student = currentUserService.get(authentication);
        return enrollmentRepository.findByStudentIdOrderByEnrolledAtDesc(student.getId())
                .stream()
                .map(enrollment -> {
                    ProgressDto progress = evaluateCompletion(student, enrollment.getCourse());
                    return new EnrolledCourseDto(
                            enrollment.getId(),
                            courseService.toDto(enrollment.getCourse()),
                            enrollment.getEnrolledAt(),
                            progress
                    );
                })
                .toList();
    }

    @Transactional
    public LearningResponse getLearning(Long courseId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Course course = courseService.findCourse(courseId);
        Enrollment enrollment = requireEnrollment(student.getId(), courseId);
        ProgressDto progress = evaluateCompletion(student, course);

        List<LessonProgress> progressRows = lessonProgressRepository
                .findByStudentIdAndLessonCourseId(student.getId(), courseId);
        Set<Long> completedLessonIds = progressRows.stream()
                .filter(LessonProgress::isCompleted)
                .map(row -> row.getLesson().getId())
                .collect(Collectors.toSet());

        List<LessonDto> lessons = lessonRepository.findByCourseIdOrderByLessonOrderAsc(courseId)
                .stream()
                .map(lesson -> new LessonDto(
                        lesson.getId(),
                        lesson.getTitle(),
                        lesson.getContent(),
                        lesson.getVideoUrl(),
                        lesson.getMaterialUrl(),
                        lesson.getLessonOrder(),
                        completedLessonIds.contains(lesson.getId())
                ))
                .toList();

        List<Quiz> quizzes = quizRepository.findByCourseIdOrderByIdAsc(courseId);
        List<StudentQuizSummaryDto> quizDtos = quizzes.stream()
                .map(quiz -> {
                    boolean passed = quizAttemptRepository
                            .existsByStudentIdAndQuizIdAndPassedTrue(student.getId(), quiz.getId());
                    Integer lastScore = quizAttemptRepository
                            .findFirstByStudentIdAndQuizIdOrderByAttemptedAtDesc(student.getId(), quiz.getId())
                            .map(QuizAttempt::getScore)
                            .orElse(null);
                    return new StudentQuizSummaryDto(
                            quiz.getId(),
                            quiz.getTitle(),
                            quiz.getDescription(),
                            quiz.getPassingScore(),
                            quiz.getQuestions().size(),
                            passed,
                            lastScore
                    );
                })
                .toList();

        return new LearningResponse(courseService.toDto(course), lessons, quizDtos, progress);
    }

    @Transactional
    public ProgressDto getProgress(Long courseId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Course course = courseService.findCourse(courseId);
        return evaluateCompletion(student, course);
    }

    @Transactional
    public ProgressDto evaluateCompletion(User student, Course course) {
        Enrollment enrollment = requireEnrollment(student.getId(), course.getId());
        ProgressDto progress = calculateProgress(student, course, enrollment);

        if (progress.allLessonsCompleted() && progress.allQuizzesPassed()) {
            boolean changed = false;
            if (!enrollment.isCompleted()) {
                enrollment.setCompleted(true);
                enrollment.setCompletedAt(LocalDateTime.now());
                changed = true;
            }
            if (enrollment.getCertificateCode() == null) {
                enrollment.setCertificateCode(generateCertificateCode());
                changed = true;
            }
            if (changed) {
                enrollment = enrollmentRepository.save(enrollment);
            }
        }

        return new ProgressDto(
                progress.totalLessons(),
                progress.completedLessons(),
                progress.totalQuizzes(),
                progress.passedQuizzes(),
                progress.percentage(),
                progress.allLessonsCompleted(),
                progress.allQuizzesPassed(),
                enrollment.isCompleted(),
                enrollment.getCertificateCode(),
                enrollment.getCompletedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<EnrolledStudentDto> getEnrolledStudents(Long courseId, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        Course course = courseService.requireOwnedCourse(courseId, teacher);
        return enrollmentRepository.findByCourseIdOrderByEnrolledAtDesc(course.getId())
                .stream()
                .map(enrollment -> {
                    ProgressDto progress = calculateProgress(enrollment.getStudent(), course, enrollment);
                    return new EnrolledStudentDto(
                            enrollment.getStudent().getId(),
                            enrollment.getStudent().getName(),
                            enrollment.getStudent().getEmail(),
                            enrollment.getEnrolledAt(),
                            enrollment.isCompleted(),
                            progress.percentage(),
                            progress.completedLessons(),
                            progress.totalLessons()
                    );
                })
                .toList();
    }

    public Enrollment requireEnrollment(Long studentId, Long courseId) {
        return enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> ApiException.forbidden("You must be enrolled in this course to access it"));
    }

    public ProgressDto calculateProgress(User student, Course course, Enrollment enrollment) {
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByLessonOrderAsc(course.getId());
        long completedLessons = lessonProgressRepository
                .countByStudentIdAndLessonCourseIdAndCompletedTrue(student.getId(), course.getId());
        List<Quiz> quizzes = quizRepository.findByCourseIdOrderByIdAsc(course.getId());
        List<Long> passedQuizIds = quizAttemptRepository
                .findPassedQuizIds(student.getId(), course.getId());

        int totalLessons = lessons.size();
        int totalQuizzes = quizzes.size();
        int completed = (int) completedLessons;
        int passed = (int) quizzes.stream()
                .map(Quiz::getId)
                .filter(passedQuizIds::contains)
                .count();

        boolean allLessonsCompleted = completed >= totalLessons;
        boolean allQuizzesPassed = passed >= totalQuizzes;
        int totalItems = totalLessons + totalQuizzes;
        int percentage = totalItems == 0 ? 0 : (int) Math.round(((completed + passed) * 100.0) / totalItems);

        return new ProgressDto(
                totalLessons,
                completed,
                totalQuizzes,
                passed,
                percentage,
                allLessonsCompleted,
                allQuizzesPassed,
                enrollment.isCompleted(),
                enrollment.getCertificateCode(),
                enrollment.getCompletedAt()
        );
    }

    private String generateCertificateCode() {
        return "LMS-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }
}

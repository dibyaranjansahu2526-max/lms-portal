package com.lms.service;

import com.lms.dto.CourseDto;
import com.lms.dto.CourseRequest;
import com.lms.entity.Course;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.CourseRepository;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.LessonProgressRepository;
import com.lms.repository.LessonRepository;
import com.lms.repository.QuizAttemptRepository;
import com.lms.repository.QuizRepository;
import com.lms.repository.ReviewRepository;
import com.lms.repository.WishlistRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ReviewRepository reviewRepository;
    private final WishlistRepository wishlistRepository;
    private final CurrentUserService currentUserService;

    public CourseService(CourseRepository courseRepository,
                         LessonRepository lessonRepository,
                         QuizRepository quizRepository,
                         EnrollmentRepository enrollmentRepository,
                         LessonProgressRepository lessonProgressRepository,
                         QuizAttemptRepository quizAttemptRepository,
                         ReviewRepository reviewRepository,
                         WishlistRepository wishlistRepository,
                         CurrentUserService currentUserService) {
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.quizRepository = quizRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.reviewRepository = reviewRepository;
        this.wishlistRepository = wishlistRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<CourseDto> browse(String search, String category, String sort) {
        String searchTerm = blankToNull(search);
        String categoryTerm = blankToNull(category);
        String sortKey = sort == null ? "newest" : sort.trim().toLowerCase();
        return courseRepository.searchPublished(searchTerm, categoryTerm)
                .stream()
                .map(this::toDto)
                .sorted(comparatorFor(sortKey))
                .toList();
    }

    private Comparator<CourseDto> comparatorFor(String sortKey) {
        return switch (sortKey) {
            case "rating" -> Comparator.comparingDouble(CourseDto::averageRating).reversed()
                    .thenComparing(Comparator.comparingLong(CourseDto::reviewCount).reversed())
                    .thenComparing(CourseDto::title, String.CASE_INSENSITIVE_ORDER);
            case "popular" -> Comparator.comparingLong(CourseDto::enrollmentCount).reversed()
                    .thenComparing(Comparator.comparingDouble(CourseDto::averageRating).reversed())
                    .thenComparing(CourseDto::title, String.CASE_INSENSITIVE_ORDER);
            default -> Comparator.comparing(
                    CourseDto::createdAt,
                    Comparator.nullsLast(Comparator.reverseOrder())
            );
        };
    }

    @Transactional(readOnly = true)
    public List<String> categories() {
        return courseRepository.findPublishedCategories();
    }

    @Transactional(readOnly = true)
    public CourseDto getVisible(Long courseId, Authentication authentication) {
        User user = currentUserService.get(authentication);
        Course course = findCourse(courseId);
        boolean owner = course.getTeacher().getId().equals(user.getId());
        if (!course.isPublished() && user.getRole() != Role.ADMIN && !owner) {
            throw ApiException.notFound("Course not found");
        }
        return toDto(course);
    }

    @Transactional(readOnly = true)
    public List<CourseDto> teacherCourses(Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        return courseRepository.findByTeacherIdOrderByCreatedAtDesc(teacher.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CourseDto create(CourseRequest request, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        Course course = new Course();
        applyRequest(course, request);
        course.setTeacher(teacher);
        course = courseRepository.save(course);
        return toDto(course);
    }

    @Transactional
    public CourseDto update(Long courseId, CourseRequest request, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        Course course = requireOwnedCourse(courseId, teacher);
        applyRequest(course, request);
        course = courseRepository.save(course);
        return toDto(course);
    }

    @Transactional
    public void delete(Long courseId, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        Course course = requireOwnedCourse(courseId, teacher);
        deleteCourseData(course.getId());
    }

    @Transactional
    public void deleteCourseAsAdmin(Long courseId) {
        Course course = findCourse(courseId);
        deleteCourseData(course.getId());
    }

    public Course requireOwnedCourse(Long courseId, User user) {
        Course course = findCourse(courseId);
        if (user.getRole() != Role.ADMIN && !course.getTeacher().getId().equals(user.getId())) {
            throw ApiException.forbidden("You can only manage your own courses");
        }
        return course;
    }

    public Course findCourse(Long courseId) {
        return courseRepository.findWithTeacherById(courseId)
                .orElseThrow(() -> ApiException.notFound("Course not found"));
    }

    public CourseDto toDto(Course course) {
        Double averageRating = reviewRepository.averageRating(course.getId());
        return new CourseDto(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.getCategory(),
                course.getImageUrl(),
                course.isPublished(),
                course.getTeacher().getId(),
                course.getTeacher().getName(),
                lessonRepository.countByCourseId(course.getId()),
                quizRepository.countByCourseId(course.getId()),
                enrollmentRepository.countByCourseId(course.getId()),
                course.getCreatedAt(),
                averageRating == null ? 0.0 : Math.round(averageRating * 10.0) / 10.0,
                reviewRepository.countByCourseId(course.getId())
        );
    }

    private void applyRequest(Course course, CourseRequest request) {
        course.setTitle(request.title().trim());
        course.setDescription(request.description().trim());
        course.setCategory(blankToNull(request.category()));
        course.setImageUrl(blankToNull(request.imageUrl()));
        course.setPublished(request.published());
    }

    private void deleteCourseData(Long courseId) {
        quizAttemptRepository.deleteByCourseId(courseId);
        lessonProgressRepository.deleteByCourseId(courseId);
        wishlistRepository.deleteByCourseId(courseId);
        reviewRepository.deleteByCourseId(courseId);
        enrollmentRepository.deleteByCourseId(courseId);
        courseRepository.deleteById(courseId);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

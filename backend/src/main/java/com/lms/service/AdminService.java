package com.lms.service;

import com.lms.dto.AdminStatsDto;
import com.lms.dto.CourseDto;
import com.lms.dto.UserDto;
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
import com.lms.repository.UserRepository;
import com.lms.repository.WishlistRepository;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ReviewRepository reviewRepository;
    private final WishlistRepository wishlistRepository;
    private final CourseService courseService;
    private final CurrentUserService currentUserService;

    public AdminService(UserRepository userRepository,
                        CourseRepository courseRepository,
                        EnrollmentRepository enrollmentRepository,
                        LessonRepository lessonRepository,
                        QuizRepository quizRepository,
                        LessonProgressRepository lessonProgressRepository,
                        QuizAttemptRepository quizAttemptRepository,
                        ReviewRepository reviewRepository,
                        WishlistRepository wishlistRepository,
                        CourseService courseService,
                        CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.lessonRepository = lessonRepository;
        this.quizRepository = quizRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.reviewRepository = reviewRepository;
        this.wishlistRepository = wishlistRepository;
        this.courseService = courseService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public AdminStatsDto stats() {
        return new AdminStatsDto(
                userRepository.count(),
                userRepository.countByRole(Role.STUDENT),
                userRepository.countByRole(Role.TEACHER),
                courseRepository.count(),
                courseRepository.countByPublishedTrue(),
                enrollmentRepository.count(),
                lessonRepository.count(),
                quizRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public List<UserDto> users() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CourseDto> courses() {
        return courseRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(courseService::toDto)
                .toList();
    }

    @Transactional
    public void deleteUser(Long userId, Authentication authentication) {
        User current = currentUserService.get(authentication);
        if (current.getId().equals(userId)) {
            throw ApiException.badRequest("You cannot delete your own admin account");
        }
        User target = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (target.getRole() == Role.TEACHER) {
            List<Course> courses = courseRepository.findByTeacherIdOrderByCreatedAtDesc(target.getId());
            for (Course course : courses) {
                courseService.deleteCourseAsAdmin(course.getId());
            }
        }

        reviewRepository.deleteByStudentId(target.getId());
        wishlistRepository.deleteByStudentId(target.getId());
        lessonProgressRepository.deleteByStudentId(target.getId());
        quizAttemptRepository.deleteByStudentId(target.getId());
        enrollmentRepository.deleteByStudentId(target.getId());
        userRepository.delete(target);
    }

    @Transactional
    public void deleteCourse(Long courseId) {
        courseService.deleteCourseAsAdmin(courseId);
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }
}

package com.lms.service;

import com.lms.dto.ReviewDto;
import com.lms.dto.ReviewRequest;
import com.lms.dto.ReviewSummaryDto;
import com.lms.entity.Course;
import com.lms.entity.Review;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.CourseRepository;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.ReviewRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final CurrentUserService currentUserService;

    public ReviewService(ReviewRepository reviewRepository,
                         EnrollmentRepository enrollmentRepository,
                         CourseRepository courseRepository,
                         CurrentUserService currentUserService) {
        this.reviewRepository = reviewRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public ReviewSummaryDto getForCourse(Long courseId, Authentication authentication) {
        User viewer = currentUserService.get(authentication);
        requireCourse(courseId);

        List<Review> reviews = reviewRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
        List<ReviewDto> reviewDtos = reviews.stream()
                .map(review -> toDto(review, viewer.getId()))
                .toList();
        ReviewDto myReview = reviewDtos.stream()
                .filter(ReviewDto::mine)
                .findFirst()
                .orElse(null);
        double average = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        return new ReviewSummaryDto(round(average), reviewDtos.size(), reviewDtos, myReview);
    }

    @Transactional
    public ReviewDto create(Long courseId, ReviewRequest request, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Course course = requireCourse(courseId);
        requireEnrollment(student, course);

        if (reviewRepository.findByStudentIdAndCourseId(student.getId(), courseId).isPresent()) {
            throw ApiException.conflict("You have already reviewed this course. Edit your existing review instead.");
        }

        Review review = new Review();
        review.setStudent(student);
        review.setCourse(course);
        review.setRating(request.rating());
        review.setComment(request.comment().trim());
        review = reviewRepository.save(review);
        return toDto(review, student.getId());
    }

    @Transactional
    public ReviewDto update(Long courseId, ReviewRequest request, Authentication authentication) {
        User student = currentUserService.get(authentication);
        requireCourse(courseId);
        Review review = reviewRepository.findByStudentIdAndCourseId(student.getId(), courseId)
                .orElseThrow(() -> ApiException.notFound("You have not reviewed this course yet"));

        review.setRating(request.rating());
        review.setComment(request.comment().trim());
        review = reviewRepository.save(review);
        return toDto(review, student.getId());
    }

    private Course requireCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> ApiException.notFound("Course not found"));
        if (!course.isPublished()) {
            throw ApiException.notFound("Course not found");
        }
        return course;
    }

    private void requireEnrollment(User student, Course course) {
        if (!enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())) {
            throw ApiException.forbidden("Only enrolled students can review this course");
        }
    }

    private ReviewDto toDto(Review review, Long viewerId) {
        return new ReviewDto(
                review.getId(),
                review.getStudent().getName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getStudent().getId().equals(viewerId)
        );
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}

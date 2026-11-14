package com.lms.controller;

import com.lms.dto.EnrolledCourseDto;
import com.lms.dto.LearningResponse;
import com.lms.dto.MockAnswerRequest;
import com.lms.dto.MockHistoryDto;
import com.lms.dto.MockLeaderboardDto;
import com.lms.dto.MockResultDto;
import com.lms.dto.MockStartDto;
import com.lms.dto.MockSubmissionRequest;
import com.lms.dto.ProgressDto;
import com.lms.dto.QuizResultDto;
import com.lms.dto.QuizSubmissionRequest;
import com.lms.dto.ReviewDto;
import com.lms.dto.ReviewRequest;
import com.lms.dto.StudentMockTestDto;
import com.lms.dto.StudentQuizDto;
import com.lms.dto.WishlistDto;
import com.lms.service.CertificateService;
import com.lms.service.EnrollmentService;
import com.lms.service.LessonService;
import com.lms.service.MockTestService;
import com.lms.service.QuizService;
import com.lms.service.ReviewService;
import com.lms.service.WishlistService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    private final EnrollmentService enrollmentService;
    private final LessonService lessonService;
    private final QuizService quizService;
    private final CertificateService certificateService;
    private final WishlistService wishlistService;
    private final ReviewService reviewService;
    private final MockTestService mockTestService;

    public StudentController(EnrollmentService enrollmentService,
                             LessonService lessonService,
                             QuizService quizService,
                             CertificateService certificateService,
                             WishlistService wishlistService,
                             ReviewService reviewService,
                             MockTestService mockTestService) {
        this.enrollmentService = enrollmentService;
        this.lessonService = lessonService;
        this.quizService = quizService;
        this.certificateService = certificateService;
        this.wishlistService = wishlistService;
        this.reviewService = reviewService;
        this.mockTestService = mockTestService;
    }

    @PostMapping("/api/courses/{courseId}/enroll")
    public EnrolledCourseDto enroll(@PathVariable Long courseId, Authentication authentication) {
        return enrollmentService.enroll(courseId, authentication);
    }

    @GetMapping("/api/student/courses")
    public List<EnrolledCourseDto> myCourses(Authentication authentication) {
        return enrollmentService.myCourses(authentication);
    }

    @GetMapping("/api/student/courses/{courseId}/learning")
    public LearningResponse learning(@PathVariable Long courseId, Authentication authentication) {
        return enrollmentService.getLearning(courseId, authentication);
    }

    @PostMapping("/api/student/lessons/{lessonId}/complete")
    public ProgressDto markLessonComplete(@PathVariable Long lessonId, Authentication authentication) {
        return lessonService.markComplete(lessonId, authentication);
    }

    @GetMapping("/api/student/quizzes/{quizId}")
    public StudentQuizDto quiz(@PathVariable Long quizId, Authentication authentication) {
        return quizService.getStudentQuiz(quizId, authentication);
    }

    @PostMapping("/api/student/quizzes/{quizId}/attempts")
    public QuizResultDto submitQuiz(@PathVariable Long quizId,
                                    @Valid @RequestBody QuizSubmissionRequest request,
                                    Authentication authentication) {
        return quizService.submitQuiz(quizId, request, authentication);
    }

    @GetMapping("/api/student/wishlist")
    public List<WishlistDto> wishlist(Authentication authentication) {
        return wishlistService.list(authentication);
    }

    @PostMapping("/api/student/wishlist/{courseId}")
    public WishlistDto addToWishlist(@PathVariable Long courseId, Authentication authentication) {
        return wishlistService.add(courseId, authentication);
    }

    @DeleteMapping("/api/student/wishlist/{courseId}")
    public ResponseEntity<Void> removeFromWishlist(@PathVariable Long courseId, Authentication authentication) {
        wishlistService.remove(courseId, authentication);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/student/courses/{courseId}/reviews")
    public ReviewDto createReview(@PathVariable Long courseId,
                                  @Valid @RequestBody ReviewRequest request,
                                  Authentication authentication) {
        return reviewService.create(courseId, request, authentication);
    }

    @PutMapping("/api/student/courses/{courseId}/reviews")
    public ReviewDto updateReview(@PathVariable Long courseId,
                                  @Valid @RequestBody ReviewRequest request,
                                  Authentication authentication) {
        return reviewService.update(courseId, request, authentication);
    }

    @GetMapping("/api/student/courses/{courseId}/certificate")
    public ResponseEntity<byte[]> certificate(@PathVariable Long courseId, Authentication authentication) {
        CertificateService.CertificatePdf certificate = certificateService.generate(courseId, authentication);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename(certificate.filename()).build());
        headers.setContentLength(certificate.bytes().length);
        return ResponseEntity.ok().headers(headers).body(certificate.bytes());
    }

    @GetMapping("/api/student/mock-tests")
    public List<StudentMockTestDto> mockTests(Authentication authentication) {
        return mockTestService.publishedTests(authentication);
    }

    @PostMapping("/api/student/mock-tests/{testId}/attempts")
    public MockStartDto startMockAttempt(@PathVariable Long testId, Authentication authentication) {
        return mockTestService.startAttempt(testId, authentication);
    }

    @PutMapping("/api/student/mock-attempts/{attemptId}/answers/{questionId}")
    public ResponseEntity<Void> saveMockAnswer(@PathVariable Long attemptId,
                                               @PathVariable Long questionId,
                                               @Valid @RequestBody MockAnswerRequest request,
                                               Authentication authentication) {
        mockTestService.saveAnswer(attemptId, questionId, request, authentication);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/student/mock-attempts/{attemptId}/submit")
    public MockResultDto submitMockAttempt(@PathVariable Long attemptId,
                                           @Valid @RequestBody(required = false) MockSubmissionRequest request,
                                           Authentication authentication) {
        return mockTestService.submitAttempt(attemptId, request, authentication);
    }

    @GetMapping("/api/student/mock-attempts/{attemptId}/result")
    public MockResultDto mockResult(@PathVariable Long attemptId, Authentication authentication) {
        return mockTestService.result(attemptId, authentication);
    }

    @GetMapping("/api/student/mock-tests/{testId}/attempts")
    public MockHistoryDto mockHistory(@PathVariable Long testId, Authentication authentication) {
        return mockTestService.history(testId, authentication);
    }

    @GetMapping("/api/student/mock-tests/{testId}/leaderboard")
    public MockLeaderboardDto mockLeaderboard(@PathVariable Long testId, Authentication authentication) {
        return mockTestService.leaderboard(testId, authentication);
    }
}

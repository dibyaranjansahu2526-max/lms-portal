package com.lms.controller;

import com.lms.dto.EnrolledCourseDto;
import com.lms.dto.LearningResponse;
import com.lms.dto.ProgressDto;
import com.lms.dto.QuizResultDto;
import com.lms.dto.QuizSubmissionRequest;
import com.lms.dto.StudentQuizDto;
import com.lms.service.CertificateService;
import com.lms.service.EnrollmentService;
import com.lms.service.LessonService;
import com.lms.service.QuizService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    public StudentController(EnrollmentService enrollmentService,
                             LessonService lessonService,
                             QuizService quizService,
                             CertificateService certificateService) {
        this.enrollmentService = enrollmentService;
        this.lessonService = lessonService;
        this.quizService = quizService;
        this.certificateService = certificateService;
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

    @GetMapping("/api/student/courses/{courseId}/certificate")
    public ResponseEntity<byte[]> certificate(@PathVariable Long courseId, Authentication authentication) {
        CertificateService.CertificatePdf certificate = certificateService.generate(courseId, authentication);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename(certificate.filename()).build());
        headers.setContentLength(certificate.bytes().length);
        return ResponseEntity.ok().headers(headers).body(certificate.bytes());
    }
}

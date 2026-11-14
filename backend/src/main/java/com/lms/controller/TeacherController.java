package com.lms.controller;

import com.lms.dto.CourseDto;
import com.lms.dto.CourseRequest;
import com.lms.dto.EnrolledStudentDto;
import com.lms.dto.LessonDto;
import com.lms.dto.LessonRequest;
import com.lms.dto.MockQuestionRequest;
import com.lms.dto.MockTestDto;
import com.lms.dto.MockTestRequest;
import com.lms.dto.QuizDto;
import com.lms.dto.QuizRequest;
import com.lms.service.CourseService;
import com.lms.service.EnrollmentService;
import com.lms.service.LessonService;
import com.lms.service.MockTestService;
import com.lms.service.QuizService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
public class TeacherController {

    private final CourseService courseService;
    private final LessonService lessonService;
    private final QuizService quizService;
    private final EnrollmentService enrollmentService;
    private final MockTestService mockTestService;

    public TeacherController(CourseService courseService,
                             LessonService lessonService,
                             QuizService quizService,
                             EnrollmentService enrollmentService,
                             MockTestService mockTestService) {
        this.courseService = courseService;
        this.lessonService = lessonService;
        this.quizService = quizService;
        this.enrollmentService = enrollmentService;
        this.mockTestService = mockTestService;
    }

    @GetMapping("/courses")
    public List<CourseDto> myCourses(Authentication authentication) {
        return courseService.teacherCourses(authentication);
    }

    @PostMapping("/courses")
    public ResponseEntity<CourseDto> createCourse(@Valid @RequestBody CourseRequest request,
                                                  Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.create(request, authentication));
    }

    @PutMapping("/courses/{courseId}")
    public CourseDto updateCourse(@PathVariable Long courseId,
                                  @Valid @RequestBody CourseRequest request,
                                  Authentication authentication) {
        return courseService.update(courseId, request, authentication);
    }

    @DeleteMapping("/courses/{courseId}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long courseId, Authentication authentication) {
        courseService.delete(courseId, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/courses/{courseId}/lessons")
    public List<LessonDto> lessons(@PathVariable Long courseId, Authentication authentication) {
        return lessonService.getCourseLessonsForTeacher(courseId, authentication);
    }

    @PostMapping("/courses/{courseId}/lessons")
    public ResponseEntity<LessonDto> addLesson(@PathVariable Long courseId,
                                               @Valid @RequestBody LessonRequest request,
                                               Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(lessonService.addLesson(courseId, request, authentication));
    }

    @PutMapping("/lessons/{lessonId}")
    public LessonDto updateLesson(@PathVariable Long lessonId,
                                  @Valid @RequestBody LessonRequest request,
                                  Authentication authentication) {
        return lessonService.updateLesson(lessonId, request, authentication);
    }

    @DeleteMapping("/lessons/{lessonId}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long lessonId, Authentication authentication) {
        lessonService.deleteLesson(lessonId, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/courses/{courseId}/quizzes")
    public List<QuizDto> quizzes(@PathVariable Long courseId, Authentication authentication) {
        return quizService.getQuizzesForTeacher(courseId, authentication);
    }

    @PostMapping("/courses/{courseId}/quizzes")
    public ResponseEntity<QuizDto> createQuiz(@PathVariable Long courseId,
                                              @Valid @RequestBody QuizRequest request,
                                              Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.createQuiz(courseId, request, authentication));
    }

    @PutMapping("/quizzes/{quizId}")
    public QuizDto updateQuiz(@PathVariable Long quizId,
                              @Valid @RequestBody QuizRequest request,
                              Authentication authentication) {
        return quizService.updateQuiz(quizId, request, authentication);
    }

    @DeleteMapping("/quizzes/{quizId}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long quizId, Authentication authentication) {
        quizService.deleteQuiz(quizId, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/courses/{courseId}/students")
    public List<EnrolledStudentDto> students(@PathVariable Long courseId, Authentication authentication) {
        return enrollmentService.getEnrolledStudents(courseId, authentication);
    }

    @GetMapping("/mock-tests")
    public List<MockTestDto> mockTests(Authentication authentication) {
        return mockTestService.teacherTests(authentication);
    }

    @GetMapping("/mock-tests/{testId}")
    public MockTestDto mockTest(@PathVariable Long testId, Authentication authentication) {
        return mockTestService.teacherTest(testId, authentication);
    }

    @PostMapping("/mock-tests")
    public ResponseEntity<MockTestDto> createMockTest(@Valid @RequestBody MockTestRequest request,
                                                      Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mockTestService.createTest(request, authentication));
    }

    @PutMapping("/mock-tests/{testId}")
    public MockTestDto updateMockTest(@PathVariable Long testId,
                                      @Valid @RequestBody MockTestRequest request,
                                      Authentication authentication) {
        return mockTestService.updateTest(testId, request, authentication);
    }

    @DeleteMapping("/mock-tests/{testId}")
    public ResponseEntity<Void> deleteMockTest(@PathVariable Long testId, Authentication authentication) {
        mockTestService.deleteTest(testId, authentication);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/mock-tests/{testId}/questions")
    public ResponseEntity<MockTestDto.QuestionDto> addMockQuestion(@PathVariable Long testId,
                                                                   @Valid @RequestBody MockQuestionRequest request,
                                                                   Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mockTestService.addQuestion(testId, request, authentication));
    }

    @PutMapping("/mock-tests/{testId}/questions/{questionId}")
    public MockTestDto.QuestionDto updateMockQuestion(@PathVariable Long testId,
                                                      @PathVariable Long questionId,
                                                      @Valid @RequestBody MockQuestionRequest request,
                                                      Authentication authentication) {
        return mockTestService.updateQuestion(testId, questionId, request, authentication);
    }

    @DeleteMapping("/mock-tests/{testId}/questions/{questionId}")
    public ResponseEntity<Void> deleteMockQuestion(@PathVariable Long testId,
                                                   @PathVariable Long questionId,
                                                   Authentication authentication) {
        mockTestService.deleteQuestion(testId, questionId, authentication);
        return ResponseEntity.noContent().build();
    }
}

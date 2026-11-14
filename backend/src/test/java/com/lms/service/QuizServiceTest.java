package com.lms.service;

import com.lms.dto.ProgressDto;
import com.lms.dto.QuizResultDto;
import com.lms.dto.QuizSubmissionRequest;
import com.lms.entity.Course;
import com.lms.entity.Question;
import com.lms.entity.QuestionOption;
import com.lms.entity.Quiz;
import com.lms.entity.QuizAttempt;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.repository.QuizAttemptRepository;
import com.lms.repository.QuizRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuizServiceTest {

    private static final long QUIZ_ID = 9L;
    private static final long COURSE_ID = 3L;
    private static final long SAVED_ATTEMPT_ID = 77L;

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private CourseService courseService;

    @Mock
    private EnrollmentService enrollmentService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private QuizService quizService;

    private User student;
    private Course course;
    private Quiz quiz;

    @BeforeEach
    void setUp() {
        student = new User();
        student.setId(7L);
        student.setName("Test Student");
        student.setEmail("student@example.com");
        student.setRole(Role.STUDENT);

        course = new Course();
        course.setId(COURSE_ID);
        course.setTitle("Java Course");

        quiz = new Quiz();
        quiz.setId(QUIZ_ID);
        quiz.setTitle("Java Quiz");
        quiz.setPassingScore(60);
        quiz.setCourse(course);

        when(currentUserService.get(authentication)).thenReturn(student);
        when(quizRepository.findWithDetailsById(QUIZ_ID)).thenReturn(Optional.of(quiz));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(invocation -> {
            QuizAttempt attempt = invocation.getArgument(0);
            attempt.setId(SAVED_ATTEMPT_ID);
            return attempt;
        });
        when(enrollmentService.evaluateCompletion(student, course)).thenReturn(completedProgress());
    }

    @Test
    void allCorrectAnswersScoreOneHundredAndPass() {
        addQuestion(1L, 10L);
        addQuestion(2L, 20L);
        addQuestion(3L, 30L);
        addQuestion(4L, 40L);

        QuizResultDto result = quizService.submitQuiz(
                QUIZ_ID,
                submission(1L, 10L, 2L, 20L, 3L, 30L, 4L, 40L),
                authentication);

        assertThat(result.score()).isEqualTo(100);
        assertThat(result.passed()).isTrue();
        assertThat(result.correctAnswers()).isEqualTo(4);
        assertThat(result.totalQuestions()).isEqualTo(4);
        assertThat(result.attemptId()).isEqualTo(SAVED_ATTEMPT_ID);
        assertThat(result.courseCompleted()).isTrue();
        assertThat(result.certificateCode()).isEqualTo("CERT-1");

        ArgumentCaptor<QuizAttempt> captor = ArgumentCaptor.forClass(QuizAttempt.class);
        verify(quizAttemptRepository).save(captor.capture());
        QuizAttempt saved = captor.getValue();
        assertThat(saved.getStudent()).isSameAs(student);
        assertThat(saved.getQuiz()).isSameAs(quiz);
        assertThat(saved.getScore()).isEqualTo(100);
        assertThat(saved.isPassed()).isTrue();
        assertThat(saved.getCorrectAnswers()).isEqualTo(4);
        assertThat(saved.getTotalQuestions()).isEqualTo(4);
    }

    @Test
    void partialScoreIsRoundedAndCanStillPass() {
        addQuestion(1L, 10L);
        addQuestion(2L, 20L);
        addQuestion(3L, 30L);

        // 2 of 3 correct -> 66.67% rounded to 67.
        QuizResultDto result = quizService.submitQuiz(
                QUIZ_ID,
                submission(1L, 10L, 2L, 20L, 3L, 31L),
                authentication);

        assertThat(result.score()).isEqualTo(67);
        assertThat(result.correctAnswers()).isEqualTo(2);
        assertThat(result.totalQuestions()).isEqualTo(3);
        assertThat(result.passed()).isTrue();
    }

    @Test
    void scoreBelowPassingMarkFails() {
        addQuestion(1L, 10L);
        addQuestion(2L, 20L);
        addQuestion(3L, 30L);
        addQuestion(4L, 40L);

        QuizResultDto result = quizService.submitQuiz(
                QUIZ_ID,
                submission(1L, 10L, 2L, 21L, 3L, 31L, 4L, 41L),
                authentication);

        assertThat(result.score()).isEqualTo(25);
        assertThat(result.correctAnswers()).isEqualTo(1);
        assertThat(result.totalQuestions()).isEqualTo(4);
        assertThat(result.passed()).isFalse();
    }

    @Test
    void unansweredQuestionsAreCountedInTotalsButNotAsCorrect() {
        addQuestion(1L, 10L);
        addQuestion(2L, 20L);
        addQuestion(3L, 30L);
        addQuestion(4L, 40L);

        QuizResultDto result = quizService.submitQuiz(
                QUIZ_ID,
                submission(1L, 10L, 2L, 20L),
                authentication);

        assertThat(result.score()).isEqualTo(50);
        assertThat(result.correctAnswers()).isEqualTo(2);
        assertThat(result.totalQuestions()).isEqualTo(4);
        assertThat(result.passed()).isFalse();
    }

    @Test
    void duplicateAnswersForTheSameQuestionUseTheLastSubmission() {
        addQuestion(1L, 10L);

        // First a wrong option, then the correct one: the second answer wins.
        QuizResultDto result = quizService.submitQuiz(
                QUIZ_ID,
                submission(1L, 11L, 1L, 10L),
                authentication);

        assertThat(result.score()).isEqualTo(100);
        assertThat(result.correctAnswers()).isEqualTo(1);
        assertThat(result.totalQuestions()).isEqualTo(1);
        assertThat(result.passed()).isTrue();
    }

    /**
     * Adds a question with two options. Option ids are derived from the question id
     * (question 1 -> options 10 and 11) so submissions stay readable.
     */
    private void addQuestion(long questionId, long correctOptionId) {
        Question question = new Question();
        question.setId(questionId);
        question.setText("Question " + questionId);
        question.setQuestionOrder((int) questionId);
        question.setQuiz(quiz);
        for (long optionId = questionId * 10; optionId < questionId * 10 + 2; optionId++) {
            QuestionOption option = new QuestionOption();
            option.setId(optionId);
            option.setText("Option " + optionId);
            option.setCorrect(optionId == correctOptionId);
            option.setOptionOrder((int) (optionId - questionId * 10) + 1);
            option.setQuestion(question);
            question.getOptions().add(option);
        }
        quiz.getQuestions().add(question);
    }

    private QuizSubmissionRequest submission(long... questionIdOptionIdPairs) {
        List<QuizSubmissionRequest.Answer> answers = new ArrayList<>();
        for (int i = 0; i < questionIdOptionIdPairs.length; i += 2) {
            answers.add(new QuizSubmissionRequest.Answer(
                    questionIdOptionIdPairs[i], questionIdOptionIdPairs[i + 1]));
        }
        return new QuizSubmissionRequest(answers);
    }

    private ProgressDto completedProgress() {
        return new ProgressDto(
                3,
                3,
                1,
                1,
                100,
                true,
                true,
                true,
                "CERT-1",
                LocalDateTime.now());
    }
}

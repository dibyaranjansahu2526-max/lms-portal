package com.lms.service;

import com.lms.dto.MockAnswerRequest;
import com.lms.dto.MockResultDto;
import com.lms.dto.MockSubmissionRequest;
import com.lms.entity.MockAnswer;
import com.lms.entity.MockAttempt;
import com.lms.entity.MockOption;
import com.lms.entity.MockQuestion;
import com.lms.entity.MockTest;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.MockAttemptRepository;
import com.lms.repository.MockTestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MockTestServiceTest {

    private static final long ATTEMPT_ID = 50L;

    @Mock
    private MockTestRepository mockTestRepository;

    @Mock
    private MockAttemptRepository mockAttemptRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private MockTestService mockTestService;

    private User student;
    private MockTest test;

    @BeforeEach
    void setUp() {
        student = new User();
        student.setId(7L);
        student.setName("Test Student");
        student.setEmail("student@example.com");
        student.setRole(Role.STUDENT);

        test = new MockTest();
        test.setId(1L);
        test.setTitle("Sample Mock Test");
        test.setCategory("Programming");
        test.setDurationMinutes(10);
        test.setTotalMarks(6);
        test.setMarksPerCorrect(2);
        test.setNegativeMarks(0.5);
        test.setPublished(true);

        when(currentUserService.get(authentication)).thenReturn(student);
    }

    @Test
    void submitScoresAllCorrectAnswersWithFullMarks() {
        addQuestion(1L, 10L);
        addQuestion(2L, 20L);
        addQuestion(3L, 30L);
        MockAttempt attempt = attemptStartedMinutesAgo(1);
        stubAttemptLookup(attempt);
        stubAttemptSave();

        MockResultDto result = mockTestService.submitAttempt(
                ATTEMPT_ID,
                submission(1L, 10L, 2L, 20L, 3L, 30L),
                authentication);

        assertThat(result.score()).isEqualTo(6.0);
        assertThat(result.percentage()).isEqualTo(100.0);
        assertThat(result.correctCount()).isEqualTo(3);
        assertThat(result.wrongCount()).isZero();
        assertThat(result.unansweredCount()).isZero();
        assertThat(result.totalQuestions()).isEqualTo(3);
        assertThat(result.passed()).isTrue();
        assertThat(result.status()).isEqualTo(MockAttempt.STATUS_SUBMITTED);
        assertThat(attempt.getSubmittedAt()).isNotNull();
        assertThat(result.timeTakenSeconds()).isBetween(0L, 600L);
    }

    @Test
    void submitAppliesNegativeMarkingAndCountsUnansweredQuestions() {
        test.setTotalMarks(8);
        addQuestion(1L, 10L);
        addQuestion(2L, 20L);
        addQuestion(3L, 30L);
        addQuestion(4L, 40L);
        MockAttempt attempt = attemptStartedMinutesAgo(2);
        stubAttemptLookup(attempt);
        stubAttemptSave();

        // Two correct (2 marks each), one wrong (-0.5) and one left unanswered.
        MockResultDto result = mockTestService.submitAttempt(
                ATTEMPT_ID,
                submission(1L, 10L, 2L, 20L, 3L, 31L),
                authentication);

        assertThat(result.score()).isEqualTo(3.5);
        assertThat(result.percentage()).isEqualTo(43.75);
        assertThat(result.correctCount()).isEqualTo(2);
        assertThat(result.wrongCount()).isEqualTo(1);
        assertThat(result.unansweredCount()).isEqualTo(1);
        assertThat(result.passed()).isTrue();

        MockResultDto.AnswerReviewDto wrongAnswer = result.answers().stream()
                .filter(answer -> answer.questionId().equals(3L))
                .findFirst()
                .orElseThrow();
        assertThat(wrongAnswer.correct()).isFalse();
        assertThat(wrongAnswer.marksAwarded()).isEqualTo(-0.5);
    }

    @Test
    void submitScoresZeroWhenNothingIsAnswered() {
        test.setTotalMarks(4);
        addQuestion(1L, 10L);
        addQuestion(2L, 20L);
        MockAttempt attempt = attemptStartedMinutesAgo(1);
        stubAttemptLookup(attempt);
        stubAttemptSave();

        MockResultDto result = mockTestService.submitAttempt(
                ATTEMPT_ID,
                new MockSubmissionRequest(List.of()),
                authentication);

        assertThat(result.score()).isZero();
        assertThat(result.correctCount()).isZero();
        assertThat(result.wrongCount()).isZero();
        assertThat(result.unansweredCount()).isEqualTo(2);
        assertThat(result.passed()).isFalse();
    }

    @Test
    void lateSubmissionIsRejectedAndAutoSubmittedWithoutScoringAnswers() {
        addQuestion(1L, 10L);
        addQuestion(2L, 20L);
        // Duration is 10 minutes; starting 11 minutes ago is past the 15 second grace period.
        MockAttempt attempt = attemptStartedMinutesAgo(11);
        stubAttemptLookup(attempt);
        stubAttemptSave();

        MockResultDto result = mockTestService.submitAttempt(
                ATTEMPT_ID,
                submission(1L, 10L, 2L, 20L),
                authentication);

        assertThat(result.status()).isEqualTo(MockAttempt.STATUS_AUTO_SUBMITTED);
        assertThat(result.score()).isZero();
        assertThat(result.correctCount()).isZero();
        assertThat(result.unansweredCount()).isEqualTo(2);
        assertThat(result.passed()).isFalse();
        assertThat(result.timeTakenSeconds()).isEqualTo(600);
        assertThat(result.answers()).allSatisfy(answer -> assertThat(answer.studentAnswer()).isNull());
        assertThat(attempt.getSubmittedAt()).isNotNull();
    }

    @Test
    void savingAnAnswerAfterTheTimeLimitIsRejectedAndAutoSubmits() {
        addQuestion(1L, 10L);
        MockAttempt attempt = attemptStartedMinutesAgo(11);
        stubAttemptLookup(attempt);
        stubAttemptSave();

        assertThatThrownBy(() -> mockTestService.saveAnswer(
                ATTEMPT_ID, 1L, new MockAnswerRequest(10L), authentication))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Time limit exceeded")
                .satisfies(error -> assertThat(((ApiException) error).getStatus())
                        .isEqualTo(HttpStatus.BAD_REQUEST));

        assertThat(attempt.getStatus()).isEqualTo(MockAttempt.STATUS_AUTO_SUBMITTED);
        assertThat(attempt.getSubmittedAt()).isNotNull();
        assertThat(attempt.getUnansweredCount()).isEqualTo(1);
        verify(mockAttemptRepository).save(attempt);
    }

    @Test
    void submittingAnAlreadySubmittedAttemptReturnsTheStoredResultWithoutRescoring() {
        addQuestion(1L, 10L);
        MockAttempt attempt = attemptStartedMinutesAgo(2);
        attempt.setStatus(MockAttempt.STATUS_SUBMITTED);
        attempt.setScore(6);
        attempt.setTotalMarks(6);
        attempt.setCorrectCount(1);
        attempt.setTotalQuestions(1);
        attempt.setPassed(true);
        attempt.setSubmittedAt(LocalDateTime.now().minusMinutes(1));
        stubAttemptLookup(attempt);

        MockResultDto result = mockTestService.submitAttempt(
                ATTEMPT_ID,
                submission(1L, 11L), // would be wrong, but it must be ignored
                authentication);

        assertThat(result.score()).isEqualTo(6.0);
        assertThat(result.correctCount()).isEqualTo(1);
        assertThat(result.status()).isEqualTo(MockAttempt.STATUS_SUBMITTED);
        verify(mockAttemptRepository, never()).save(any(MockAttempt.class));
    }

    private void stubAttemptLookup(MockAttempt attempt) {
        when(mockAttemptRepository.findById(ATTEMPT_ID)).thenReturn(Optional.of(attempt));
    }

    private void stubAttemptSave() {
        when(mockAttemptRepository.save(any(MockAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    /**
     * Creates a question with four options. Option ids are derived from the question id
     * to keep submissions readable (question 1 -> options 10, 11, 12, 13).
     */
    private MockQuestion addQuestion(long questionId, long correctOptionId) {
        MockQuestion question = new MockQuestion();
        question.setId(questionId);
        question.setText("Question " + questionId);
        question.setQuestionOrder((int) questionId);
        question.setMockTest(test);
        for (long optionId = questionId * 10; optionId < questionId * 10 + 4; optionId++) {
            MockOption option = new MockOption();
            option.setId(optionId);
            option.setText("Option " + optionId);
            option.setCorrect(optionId == correctOptionId);
            option.setOptionOrder((int) (optionId - questionId * 10) + 1);
            option.setQuestion(question);
            question.getOptions().add(option);
        }
        test.getQuestions().add(question);
        return question;
    }

    private MockAttempt attemptStartedMinutesAgo(int minutes) {
        MockAttempt attempt = new MockAttempt();
        attempt.setId(ATTEMPT_ID);
        attempt.setStudent(student);
        attempt.setMockTest(test);
        attempt.setStartedAt(LocalDateTime.now().minusMinutes(minutes));
        attempt.setStatus(MockAttempt.STATUS_IN_PROGRESS);
        attempt.setTotalMarks(test.getTotalMarks());
        attempt.setTotalQuestions(test.getQuestions().size());
        attempt.setScore(0);
        attempt.setAnswers(new ArrayList<>());

        for (MockQuestion question : test.getQuestions()) {
            MockOption correctOption = question.getOptions().stream()
                    .filter(MockOption::isCorrect)
                    .findFirst()
                    .orElseThrow();

            MockAnswer answer = new MockAnswer();
            answer.setAttempt(attempt);
            answer.setQuestionId(question.getId());
            answer.setQuestionText(question.getText());
            answer.setQuestionOrder(question.getQuestionOrder());
            answer.setCorrectOptionId(correctOption.getId());
            answer.setCorrectOptionText(correctOption.getText());
            answer.setAnswered(false);
            answer.setCorrect(false);
            answer.setMarksAwarded(0);
            attempt.getAnswers().add(answer);
        }
        return attempt;
    }

    private MockSubmissionRequest submission(long... questionIdOptionIdPairs) {
        List<MockSubmissionRequest.AnswerRequest> answers = new ArrayList<>();
        for (int i = 0; i < questionIdOptionIdPairs.length; i += 2) {
            answers.add(new MockSubmissionRequest.AnswerRequest(
                    questionIdOptionIdPairs[i], questionIdOptionIdPairs[i + 1]));
        }
        return new MockSubmissionRequest(answers);
    }
}

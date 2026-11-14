package com.lms.service;

import com.lms.dto.MockAnswerRequest;
import com.lms.dto.MockAttemptSummaryDto;
import com.lms.dto.MockHistoryDto;
import com.lms.dto.MockLeaderboardDto;
import com.lms.dto.MockQuestionRequest;
import com.lms.dto.MockResultDto;
import com.lms.dto.MockStartDto;
import com.lms.dto.MockSubmissionRequest;
import com.lms.dto.MockTestDto;
import com.lms.dto.MockTestRequest;
import com.lms.dto.StudentMockTestDto;
import com.lms.entity.MockAnswer;
import com.lms.entity.MockAttempt;
import com.lms.entity.MockOption;
import com.lms.entity.MockQuestion;
import com.lms.entity.MockTest;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.MockAttemptRepository;
import com.lms.repository.MockTestRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MockTestService {

    private static final long SUBMISSION_GRACE_SECONDS = 15;
    private static final double PASS_PERCENTAGE = 40.0;

    private final MockTestRepository mockTestRepository;
    private final MockAttemptRepository mockAttemptRepository;
    private final CurrentUserService currentUserService;

    public MockTestService(MockTestRepository mockTestRepository,
                           MockAttemptRepository mockAttemptRepository,
                           CurrentUserService currentUserService) {
        this.mockTestRepository = mockTestRepository;
        this.mockAttemptRepository = mockAttemptRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<MockTestDto> teacherTests(Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        return mockTestRepository.findByTeacherIdOrderByCreatedAtDesc(teacher.getId())
                .stream()
                .map(this::toTestDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public MockTestDto teacherTest(Long testId, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        return toTestDto(requireOwnedTest(testId, teacher));
    }

    @Transactional
    public MockTestDto createTest(MockTestRequest request, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        validateTestRequest(request);

        MockTest test = new MockTest();
        applyTest(test, request);
        test.setTeacher(teacher);
        return toTestDto(mockTestRepository.save(test));
    }

    @Transactional
    public MockTestDto updateTest(Long testId, MockTestRequest request, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        MockTest test = requireOwnedTest(testId, teacher);
        validateTestRequest(request);
        applyTest(test, request);
        return toTestDto(mockTestRepository.save(test));
    }

    @Transactional
    public void deleteTest(Long testId, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        MockTest test = requireOwnedTest(testId, teacher);
        mockTestRepository.delete(test);
    }

    @Transactional
    public MockTestDto.QuestionDto addQuestion(Long testId, MockQuestionRequest request, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        MockTest test = requireOwnedTest(testId, teacher);
        validateQuestion(request);

        MockQuestion question = new MockQuestion();
        question.setText(request.text().trim());
        question.setQuestionOrder(test.getQuestions().size() + 1);
        question.setMockTest(test);
        applyOptions(question, request.options());
        test.getQuestions().add(question);

        mockTestRepository.flush();
        return toQuestionDto(question);
    }

    @Transactional
    public MockTestDto.QuestionDto updateQuestion(Long testId, Long questionId,
                                                  MockQuestionRequest request,
                                                  Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        MockTest test = requireOwnedTest(testId, teacher);
        MockQuestion question = findQuestion(test, questionId);
        validateQuestion(request);

        question.setText(request.text().trim());
        question.getOptions().clear();
        applyOptions(question, request.options());
        mockTestRepository.flush();
        return toQuestionDto(question);
    }

    @Transactional
    public void deleteQuestion(Long testId, Long questionId, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        MockTest test = requireOwnedTest(testId, teacher);
        MockQuestion question = findQuestion(test, questionId);
        test.getQuestions().remove(question);

        int order = 1;
        for (MockQuestion remaining : test.getQuestions()) {
            remaining.setQuestionOrder(order++);
        }
        mockTestRepository.save(test);
    }

    @Transactional(readOnly = true)
    public List<StudentMockTestDto> publishedTests(Authentication authentication) {
        User student = currentUserService.get(authentication);
        return mockTestRepository.findByPublishedTrueOrderByCreatedAtDesc()
                .stream()
                .map(test -> {
                    Double bestScore = mockAttemptRepository
                            .findFirstByStudentIdAndMockTestIdAndSubmittedAtIsNotNullOrderByScoreDescTimeTakenSecondsAscSubmittedAtAsc(
                                    student.getId(), test.getId())
                            .map(MockAttempt::getScore)
                            .orElse(null);
                    long attemptCount = mockAttemptRepository
                            .countByStudentIdAndMockTestIdAndSubmittedAtIsNotNull(student.getId(), test.getId());
                    return new StudentMockTestDto(
                            test.getId(),
                            test.getTitle(),
                            test.getDescription(),
                            test.getCategory(),
                            test.getDurationMinutes(),
                            test.getTotalMarks(),
                            test.getMarksPerCorrect(),
                            test.getNegativeMarks(),
                            test.getQuestions().size(),
                            bestScore,
                            attemptCount
                    );
                })
                .toList();
    }

    @Transactional
    public MockStartDto startAttempt(Long testId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        MockTest test = findTest(testId);
        if (!test.isPublished()) {
            throw ApiException.notFound("Mock test not found");
        }

        LocalDateTime now = LocalDateTime.now();
        MockAttempt active = mockAttemptRepository
                .findFirstByStudentIdAndMockTestIdAndStatusOrderByStartedAtDesc(
                        student.getId(), testId, MockAttempt.STATUS_IN_PROGRESS)
                .orElse(null);

        if (active != null) {
            if (isPastGrace(active, now)) {
                finalizeAttempt(active, MockAttempt.STATUS_AUTO_SUBMITTED, durationSeconds(active));
            } else {
                return toStartDto(active, now);
            }
        }

        if (test.getQuestions().isEmpty()) {
            throw ApiException.badRequest("This mock test does not have any questions yet");
        }

        MockAttempt attempt = new MockAttempt();
        attempt.setStudent(student);
        attempt.setMockTest(test);
        attempt.setStartedAt(now);
        attempt.setStatus(MockAttempt.STATUS_IN_PROGRESS);
        attempt.setTotalMarks(test.getTotalMarks());
        attempt.setTotalQuestions(test.getQuestions().size());
        attempt.setScore(0);
        attempt.setPassed(false);
        attempt.setCorrectCount(0);
        attempt.setWrongCount(0);
        attempt.setUnansweredCount(test.getQuestions().size());
        attempt.setTimeTakenSeconds(0);

        for (MockQuestion question : test.getQuestions()) {
            MockOption correctOption = question.getOptions().stream()
                    .filter(MockOption::isCorrect)
                    .findFirst()
                    .orElseThrow(() -> ApiException.badRequest("Every question needs one correct answer"));

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

        attempt = mockAttemptRepository.save(attempt);
        return toStartDto(attempt, now);
    }

    @Transactional
    public void saveAnswer(Long attemptId, Long questionId, MockAnswerRequest request, Authentication authentication) {
        User student = currentUserService.get(authentication);
        MockAttempt attempt = requireOwnedAttempt(attemptId, student);
        if (!MockAttempt.STATUS_IN_PROGRESS.equals(attempt.getStatus())) {
            throw ApiException.conflict("This attempt has already been submitted");
        }

        LocalDateTime now = LocalDateTime.now();
        if (isPastGrace(attempt, now)) {
            finalizeAttempt(attempt, MockAttempt.STATUS_AUTO_SUBMITTED, durationSeconds(attempt));
            throw ApiException.badRequest("Time limit exceeded. Your attempt was submitted automatically.");
        }

        MockQuestion question = findQuestion(attempt.getMockTest(), questionId);
        MockOption option = question.getOptions().stream()
                .filter(candidate -> candidate.getId().equals(request.optionId()))
                .findFirst()
                .orElseThrow(() -> ApiException.badRequest("That option does not belong to this question"));

        MockAnswer answer = attempt.getAnswers().stream()
                .filter(candidate -> candidate.getQuestionId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> ApiException.badRequest("This question is not part of the attempt"));

        answer.setSelectedOptionId(option.getId());
        answer.setSelectedOptionText(option.getText());
        answer.setAnswered(true);
        mockAttemptRepository.save(attempt);
    }

    @Transactional
    public MockResultDto submitAttempt(Long attemptId, MockSubmissionRequest request, Authentication authentication) {
        User student = currentUserService.get(authentication);
        MockAttempt attempt = requireOwnedAttempt(attemptId, student);

        if (!MockAttempt.STATUS_IN_PROGRESS.equals(attempt.getStatus())) {
            return toResultDto(attempt);
        }

        LocalDateTime now = LocalDateTime.now();
        boolean late = isPastGrace(attempt, now);
        if (!late) {
            applySubmittedAnswers(attempt, request);
        }

        long elapsed = Math.max(0, Duration.between(attempt.getStartedAt(), now).getSeconds());
        long timeTaken = late ? durationSeconds(attempt) : Math.min(elapsed, durationSeconds(attempt));
        finalizeAttempt(attempt, late ? MockAttempt.STATUS_AUTO_SUBMITTED : MockAttempt.STATUS_SUBMITTED, timeTaken);
        return toResultDto(attempt);
    }

    @Transactional(readOnly = true)
    public MockResultDto result(Long attemptId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        MockAttempt attempt = requireOwnedAttempt(attemptId, student);
        if (MockAttempt.STATUS_IN_PROGRESS.equals(attempt.getStatus())) {
            throw ApiException.badRequest("This attempt has not been submitted yet");
        }
        return toResultDto(attempt);
    }

    @Transactional(readOnly = true)
    public MockHistoryDto history(Long testId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        MockTest test = findTest(testId);
        List<MockAttemptSummaryDto> attempts = mockAttemptRepository
                .findByStudentIdAndMockTestIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(student.getId(), testId)
                .stream()
                .map(this::toAttemptSummary)
                .toList();
        return new MockHistoryDto(
                test.getId(),
                test.getTitle(),
                test.getCategory(),
                test.getTotalMarks(),
                test.getDurationMinutes(),
                attempts
        );
    }

    @Transactional(readOnly = true)
    public MockLeaderboardDto leaderboard(Long testId, Authentication authentication) {
        currentUserService.get(authentication);
        MockTest test = findTest(testId);
        if (!test.isPublished()) {
            throw ApiException.notFound("Mock test not found");
        }

        Map<Long, MockAttempt> bestByStudent = new LinkedHashMap<>();
        for (MockAttempt attempt : mockAttemptRepository
                .findByMockTestIdAndSubmittedAtIsNotNullOrderByScoreDescTimeTakenSecondsAscSubmittedAtAsc(testId)) {
            bestByStudent.putIfAbsent(attempt.getStudent().getId(), attempt);
        }

        List<MockLeaderboardDto.Entry> entries = new ArrayList<>();
        int rank = 1;
        for (MockAttempt attempt : bestByStudent.values()) {
            if (rank > 10) {
                break;
            }
            entries.add(new MockLeaderboardDto.Entry(
                    rank++,
                    attempt.getStudent().getName(),
                    round2(attempt.getScore()),
                    round2(attempt.getTotalMarks()),
                    percentage(attempt),
                    attempt.getTimeTakenSeconds(),
                    attempt.getSubmittedAt()
            ));
        }

        return new MockLeaderboardDto(
                test.getId(),
                test.getTitle(),
                test.getCategory(),
                test.getTotalMarks(),
                entries
        );
    }

    private MockTest requireOwnedTest(Long testId, User teacher) {
        MockTest test = findTest(testId);
        if (!test.getTeacher().getId().equals(teacher.getId())) {
            throw ApiException.forbidden("You can only manage your own mock tests");
        }
        return test;
    }

    private MockTest findTest(Long testId) {
        return mockTestRepository.findById(testId)
                .orElseThrow(() -> ApiException.notFound("Mock test not found"));
    }

    private MockAttempt requireOwnedAttempt(Long attemptId, User student) {
        MockAttempt attempt = mockAttemptRepository.findById(attemptId)
                .orElseThrow(() -> ApiException.notFound("Attempt not found"));
        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw ApiException.forbidden("You can only access your own attempts");
        }
        return attempt;
    }

    private MockQuestion findQuestion(MockTest test, Long questionId) {
        return test.getQuestions().stream()
                .filter(question -> question.getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("Question not found"));
    }

    private void validateTestRequest(MockTestRequest request) {
        if (request.totalMarks() == null || request.totalMarks() <= 0) {
            throw ApiException.badRequest("Total marks must be greater than zero");
        }
        if (request.marksPerCorrect() == null || request.marksPerCorrect() <= 0) {
            throw ApiException.badRequest("Marks per correct answer must be greater than zero");
        }
        if (request.negativeMarks() != null && request.negativeMarks() < 0) {
            throw ApiException.badRequest("Negative marks cannot be negative");
        }
    }

    private void applyTest(MockTest test, MockTestRequest request) {
        test.setTitle(request.title().trim());
        test.setDescription(request.description() == null ? null : request.description().trim());
        test.setCategory(request.category().trim());
        test.setDurationMinutes(request.durationMinutes());
        test.setTotalMarks(round2(request.totalMarks()));
        test.setMarksPerCorrect(round2(request.marksPerCorrect()));
        test.setNegativeMarks(round2(request.negativeMarks() == null ? 0 : request.negativeMarks()));
        test.setPublished(request.published() == null || request.published());
    }

    private void validateQuestion(MockQuestionRequest request) {
        if (request.options() == null || request.options().size() != 4) {
            throw ApiException.badRequest("Every question must have exactly four options");
        }
        long correctCount = request.options().stream().filter(MockQuestionRequest.OptionRequest::correct).count();
        if (correctCount != 1) {
            throw ApiException.badRequest("Every question must have exactly one correct option");
        }
        Set<String> seen = new HashSet<>();
        for (MockQuestionRequest.OptionRequest option : request.options()) {
            if (!seen.add(option.text().trim().toLowerCase())) {
                throw ApiException.badRequest("Options in a question must be unique");
            }
        }
    }

    private void applyOptions(MockQuestion question, List<MockQuestionRequest.OptionRequest> options) {
        int optionOrder = 1;
        for (MockQuestionRequest.OptionRequest optionRequest : options) {
            MockOption option = new MockOption();
            option.setText(optionRequest.text().trim());
            option.setCorrect(optionRequest.correct());
            option.setOptionOrder(optionOrder++);
            option.setQuestion(question);
            question.getOptions().add(option);
        }
    }

    private void applySubmittedAnswers(MockAttempt attempt, MockSubmissionRequest request) {
        if (request == null || request.answers() == null) {
            return;
        }
        for (MockSubmissionRequest.AnswerRequest submitted : request.answers()) {
            MockAnswer answer = attempt.getAnswers().stream()
                    .filter(candidate -> candidate.getQuestionId().equals(submitted.questionId()))
                    .findFirst()
                    .orElseThrow(() -> ApiException.badRequest("A submitted question is not part of this attempt"));

            MockQuestion question = findQuestion(attempt.getMockTest(), submitted.questionId());
            MockOption option = question.getOptions().stream()
                    .filter(candidate -> candidate.getId().equals(submitted.optionId()))
                    .findFirst()
                    .orElseThrow(() -> ApiException.badRequest("A submitted option does not belong to its question"));

            answer.setSelectedOptionId(option.getId());
            answer.setSelectedOptionText(option.getText());
            answer.setAnswered(true);
        }
    }

    private void finalizeAttempt(MockAttempt attempt, String status, long timeTakenSeconds) {
        MockTest test = attempt.getMockTest();
        int correctCount = 0;
        int wrongCount = 0;
        int unansweredCount = 0;
        double score = 0;

        for (MockAnswer answer : attempt.getAnswers()) {
            if (answer.getSelectedOptionId() == null) {
                answer.setAnswered(false);
                answer.setCorrect(false);
                answer.setMarksAwarded(0);
                unansweredCount++;
                continue;
            }

            boolean correct = answer.getSelectedOptionId().equals(answer.getCorrectOptionId());
            answer.setAnswered(true);
            answer.setCorrect(correct);
            if (correct) {
                correctCount++;
                answer.setMarksAwarded(test.getMarksPerCorrect());
                score += test.getMarksPerCorrect();
            } else {
                wrongCount++;
                answer.setMarksAwarded(-test.getNegativeMarks());
                score -= test.getNegativeMarks();
            }
        }

        double roundedScore = round2(score);
        attempt.setScore(roundedScore);
        attempt.setCorrectCount(correctCount);
        attempt.setWrongCount(wrongCount);
        attempt.setUnansweredCount(unansweredCount);
        attempt.setTotalQuestions(attempt.getAnswers().size());
        attempt.setTotalMarks(test.getTotalMarks());
        attempt.setPassed(percentage(roundedScore, attempt.getTotalMarks()) >= PASS_PERCENTAGE);
        attempt.setStatus(status);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setTimeTakenSeconds(Math.max(0, timeTakenSeconds));
        mockAttemptRepository.save(attempt);
    }

    private boolean isPastGrace(MockAttempt attempt, LocalDateTime now) {
        LocalDateTime deadline = attempt.getStartedAt()
                .plusMinutes(attempt.getMockTest().getDurationMinutes())
                .plusSeconds(SUBMISSION_GRACE_SECONDS);
        return now.isAfter(deadline);
    }

    private long durationSeconds(MockAttempt attempt) {
        return Duration.ofMinutes(attempt.getMockTest().getDurationMinutes()).getSeconds();
    }

    private MockStartDto toStartDto(MockAttempt attempt, LocalDateTime now) {
        MockTest test = attempt.getMockTest();
        LocalDateTime expiresAt = attempt.getStartedAt().plusMinutes(test.getDurationMinutes());
        long remainingSeconds = Math.max(0, Duration.between(now, expiresAt).getSeconds());

        List<MockStartDto.QuestionDto> questions = test.getQuestions().stream()
                .map(question -> new MockStartDto.QuestionDto(
                        question.getId(),
                        question.getText(),
                        question.getQuestionOrder(),
                        question.getOptions().stream()
                                .map(option -> new MockStartDto.OptionDto(option.getId(), option.getText()))
                                .toList()
                ))
                .toList();

        List<MockStartDto.SavedAnswerDto> savedAnswers = attempt.getAnswers().stream()
                .filter(answer -> answer.getSelectedOptionId() != null)
                .map(answer -> new MockStartDto.SavedAnswerDto(answer.getQuestionId(), answer.getSelectedOptionId()))
                .toList();

        return new MockStartDto(
                attempt.getId(),
                test.getId(),
                test.getTitle(),
                test.getDescription(),
                test.getCategory(),
                test.getDurationMinutes(),
                test.getTotalMarks(),
                test.getMarksPerCorrect(),
                test.getNegativeMarks(),
                attempt.getStartedAt(),
                expiresAt,
                remainingSeconds,
                questions,
                savedAnswers
        );
    }

    private MockResultDto toResultDto(MockAttempt attempt) {
        List<MockResultDto.AnswerReviewDto> answers = attempt.getAnswers().stream()
                .map(answer -> new MockResultDto.AnswerReviewDto(
                        answer.getQuestionId(),
                        answer.getQuestionText(),
                        answer.getQuestionOrder(),
                        answer.isAnswered() ? answer.getSelectedOptionText() : null,
                        answer.getCorrectOptionText(),
                        answer.isCorrect(),
                        answer.isAnswered(),
                        round2(answer.getMarksAwarded())
                ))
                .toList();

        return new MockResultDto(
                attempt.getId(),
                attempt.getMockTest().getId(),
                attempt.getMockTest().getTitle(),
                attempt.getMockTest().getCategory(),
                round2(attempt.getScore()),
                round2(attempt.getTotalMarks()),
                percentage(attempt),
                attempt.getCorrectCount(),
                attempt.getWrongCount(),
                attempt.getUnansweredCount(),
                attempt.getTotalQuestions(),
                attempt.getTimeTakenSeconds(),
                attempt.getStartedAt(),
                attempt.getSubmittedAt(),
                attempt.isPassed(),
                attempt.getStatus(),
                answers
        );
    }

    private MockAttemptSummaryDto toAttemptSummary(MockAttempt attempt) {
        return new MockAttemptSummaryDto(
                attempt.getId(),
                round2(attempt.getScore()),
                round2(attempt.getTotalMarks()),
                percentage(attempt),
                attempt.getCorrectCount(),
                attempt.getWrongCount(),
                attempt.getUnansweredCount(),
                attempt.getTotalQuestions(),
                attempt.getTimeTakenSeconds(),
                attempt.getSubmittedAt(),
                attempt.getStatus(),
                attempt.isPassed()
        );
    }

    private MockTestDto toTestDto(MockTest test) {
        List<MockTestDto.QuestionDto> questions = test.getQuestions().stream()
                .map(this::toQuestionDto)
                .toList();
        return new MockTestDto(
                test.getId(),
                test.getTitle(),
                test.getDescription(),
                test.getCategory(),
                test.getDurationMinutes(),
                round2(test.getTotalMarks()),
                round2(test.getMarksPerCorrect()),
                round2(test.getNegativeMarks()),
                test.isPublished(),
                test.getCreatedAt(),
                questions.size(),
                mockAttemptRepository.countByMockTestIdAndSubmittedAtIsNotNull(test.getId()),
                questions
        );
    }

    private MockTestDto.QuestionDto toQuestionDto(MockQuestion question) {
        return new MockTestDto.QuestionDto(
                question.getId(),
                question.getText(),
                question.getQuestionOrder(),
                question.getOptions().stream()
                        .map(option -> new MockTestDto.OptionDto(
                                option.getId(),
                                option.getText(),
                                option.isCorrect()
                        ))
                        .toList()
        );
    }

    private double percentage(MockAttempt attempt) {
        return percentage(attempt.getScore(), attempt.getTotalMarks());
    }

    private double percentage(double score, double totalMarks) {
        if (totalMarks <= 0) {
            return 0;
        }
        return round2((score * 100.0) / totalMarks);
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}

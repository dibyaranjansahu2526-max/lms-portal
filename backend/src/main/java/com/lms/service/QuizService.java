package com.lms.service;

import com.lms.dto.ProgressDto;
import com.lms.dto.QuizDto;
import com.lms.dto.QuizRequest;
import com.lms.dto.QuizResultDto;
import com.lms.dto.QuizSubmissionRequest;
import com.lms.dto.StudentQuizDto;
import com.lms.entity.Course;
import com.lms.entity.Question;
import com.lms.entity.QuestionOption;
import com.lms.entity.Quiz;
import com.lms.entity.QuizAttempt;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.QuizAttemptRepository;
import com.lms.repository.QuizRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CourseService courseService;
    private final EnrollmentService enrollmentService;
    private final CurrentUserService currentUserService;

    public QuizService(QuizRepository quizRepository,
                       QuizAttemptRepository quizAttemptRepository,
                       CourseService courseService,
                       EnrollmentService enrollmentService,
                       CurrentUserService currentUserService) {
        this.quizRepository = quizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.courseService = courseService;
        this.enrollmentService = enrollmentService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<QuizDto> getQuizzesForTeacher(Long courseId, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        courseService.requireOwnedCourse(courseId, teacher);
        return quizRepository.findByCourseIdOrderByIdAsc(courseId)
                .stream()
                .map(this::toTeacherDto)
                .toList();
    }

    @Transactional
    public QuizDto createQuiz(Long courseId, QuizRequest request, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        Course course = courseService.requireOwnedCourse(courseId, teacher);
        validateQuiz(request);

        Quiz quiz = new Quiz();
        quiz.setCourse(course);
        applyQuiz(quiz, request);
        quiz = quizRepository.save(quiz);
        return toTeacherDto(quiz);
    }

    @Transactional
    public QuizDto updateQuiz(Long quizId, QuizRequest request, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        Quiz quiz = findQuiz(quizId);
        courseService.requireOwnedCourse(quiz.getCourse().getId(), teacher);
        validateQuiz(request);

        quizAttemptRepository.deleteByQuizId(quizId);
        applyQuiz(quiz, request);
        quiz = quizRepository.save(quiz);
        return toTeacherDto(quiz);
    }

    @Transactional
    public void deleteQuiz(Long quizId, Authentication authentication) {
        User teacher = currentUserService.get(authentication);
        Quiz quiz = findQuiz(quizId);
        courseService.requireOwnedCourse(quiz.getCourse().getId(), teacher);
        quizAttemptRepository.deleteByQuizId(quizId);
        quizRepository.delete(quiz);
    }

    @Transactional(readOnly = true)
    public StudentQuizDto getStudentQuiz(Long quizId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Quiz quiz = findQuiz(quizId);
        enrollmentService.requireEnrollment(student.getId(), quiz.getCourse().getId());

        boolean passed = quizAttemptRepository
                .existsByStudentIdAndQuizIdAndPassedTrue(student.getId(), quizId);
        Integer lastScore = quizAttemptRepository
                .findFirstByStudentIdAndQuizIdOrderByAttemptedAtDesc(student.getId(), quizId)
                .map(QuizAttempt::getScore)
                .orElse(null);

        List<StudentQuizDto.QuestionDto> questions = quiz.getQuestions().stream()
                .map(question -> new StudentQuizDto.QuestionDto(
                        question.getId(),
                        question.getText(),
                        question.getOptions().stream()
                                .map(option -> new StudentQuizDto.OptionDto(option.getId(), option.getText()))
                                .toList()
                ))
                .toList();

        return new StudentQuizDto(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getPassingScore(),
                quiz.getCourse().getId(),
                quiz.getCourse().getTitle(),
                passed,
                lastScore,
                questions
        );
    }

    @Transactional
    public QuizResultDto submitQuiz(Long quizId, QuizSubmissionRequest request, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Quiz quiz = findQuiz(quizId);
        enrollmentService.requireEnrollment(student.getId(), quiz.getCourse().getId());

        Map<Long, Long> answers = request.answers().stream()
                .collect(Collectors.toMap(
                        QuizSubmissionRequest.Answer::questionId,
                        QuizSubmissionRequest.Answer::optionId,
                        (first, second) -> second
                ));

        int correctAnswers = 0;
        for (Question question : quiz.getQuestions()) {
            Long selectedOptionId = answers.get(question.getId());
            if (selectedOptionId != null && question.getOptions().stream()
                    .anyMatch(option -> option.getId().equals(selectedOptionId) && option.isCorrect())) {
                correctAnswers++;
            }
        }

        int totalQuestions = quiz.getQuestions().size();
        int score = totalQuestions == 0 ? 0 : (int) Math.round((correctAnswers * 100.0) / totalQuestions);
        boolean passed = score >= quiz.getPassingScore();

        QuizAttempt attempt = new QuizAttempt();
        attempt.setStudent(student);
        attempt.setQuiz(quiz);
        attempt.setScore(score);
        attempt.setPassed(passed);
        attempt.setCorrectAnswers(correctAnswers);
        attempt.setTotalQuestions(totalQuestions);
        attempt = quizAttemptRepository.save(attempt);

        ProgressDto progress = enrollmentService.evaluateCompletion(student, quiz.getCourse());

        return new QuizResultDto(
                attempt.getId(),
                score,
                passed,
                quiz.getPassingScore(),
                correctAnswers,
                totalQuestions,
                progress.completed(),
                progress.certificateCode()
        );
    }

    public Quiz findQuiz(Long quizId) {
        return quizRepository.findWithDetailsById(quizId)
                .orElseThrow(() -> ApiException.notFound("Quiz not found"));
    }

    private void validateQuiz(QuizRequest request) {
        for (QuizRequest.QuestionRequest question : request.questions()) {
            if (question.options() == null || question.options().size() < 2) {
                throw ApiException.badRequest("Every question must have at least two options");
            }
            long correctCount = question.options().stream().filter(QuizRequest.OptionRequest::correct).count();
            if (correctCount != 1) {
                throw ApiException.badRequest("Every question must have exactly one correct option");
            }
            Set<String> seen = new HashSet<>();
            for (QuizRequest.OptionRequest option : question.options()) {
                if (!seen.add(option.text().trim().toLowerCase())) {
                    throw ApiException.badRequest("Options in a question must be unique");
                }
            }
        }
    }

    private void applyQuiz(Quiz quiz, QuizRequest request) {
        quiz.setTitle(request.title().trim());
        quiz.setDescription(request.description() == null ? null : request.description().trim());
        quiz.setPassingScore(request.passingScore() == null ? 60 : request.passingScore());

        quiz.getQuestions().clear();
        int questionOrder = 1;
        for (QuizRequest.QuestionRequest questionRequest : request.questions()) {
            Question question = new Question();
            question.setText(questionRequest.text().trim());
            question.setQuestionOrder(questionOrder++);
            question.setQuiz(quiz);

            int optionOrder = 1;
            for (QuizRequest.OptionRequest optionRequest : questionRequest.options()) {
                QuestionOption option = new QuestionOption();
                option.setText(optionRequest.text().trim());
                option.setCorrect(optionRequest.correct());
                option.setOptionOrder(optionOrder++);
                option.setQuestion(question);
                question.getOptions().add(option);
            }
            quiz.getQuestions().add(question);
        }
    }

    private QuizDto toTeacherDto(Quiz quiz) {
        List<QuizDto.QuestionDto> questions = quiz.getQuestions().stream()
                .map(question -> new QuizDto.QuestionDto(
                        question.getId(),
                        question.getText(),
                        question.getQuestionOrder(),
                        question.getOptions().stream()
                                .map(option -> new QuizDto.OptionDto(
                                        option.getId(),
                                        option.getText(),
                                        option.isCorrect()
                                ))
                                .toList()
                ))
                .toList();

        return new QuizDto(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getPassingScore(),
                quiz.getCourse().getId(),
                questions
        );
    }
}

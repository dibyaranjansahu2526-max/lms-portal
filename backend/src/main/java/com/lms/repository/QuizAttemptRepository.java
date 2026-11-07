package com.lms.repository;

import com.lms.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    boolean existsByStudentIdAndQuizIdAndPassedTrue(Long studentId, Long quizId);

    Optional<QuizAttempt> findFirstByStudentIdAndQuizIdOrderByAttemptedAtDesc(Long studentId, Long quizId);

    @Query("select distinct a.quiz.id from QuizAttempt a where a.student.id = :studentId and a.quiz.course.id = :courseId and a.passed = true")
    List<Long> findPassedQuizIds(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Modifying
    @Query("delete from QuizAttempt a where a.quiz.id = :quizId")
    void deleteByQuizId(@Param("quizId") Long quizId);

    @Modifying
    @Query("delete from QuizAttempt a where a.quiz.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("delete from QuizAttempt a where a.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
}

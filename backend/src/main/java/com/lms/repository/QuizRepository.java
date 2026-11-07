package com.lms.repository;

import com.lms.entity.Quiz;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

    List<Quiz> findByCourseIdOrderByIdAsc(Long courseId);

    @EntityGraph(attributePaths = {"course", "course.teacher"})
    Optional<Quiz> findWithDetailsById(Long id);

    long countByCourseId(Long courseId);
}

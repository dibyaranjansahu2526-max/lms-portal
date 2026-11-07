package com.lms.repository;

import com.lms.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByCourseIdOrderByLessonOrderAsc(Long courseId);

    Optional<Lesson> findByIdAndCourseId(Long id, Long courseId);

    long countByCourseId(Long courseId);
}

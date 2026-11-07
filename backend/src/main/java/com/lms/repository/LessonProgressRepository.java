package com.lms.repository;

import com.lms.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    List<LessonProgress> findByStudentIdAndLessonCourseId(Long studentId, Long courseId);

    long countByStudentIdAndLessonCourseIdAndCompletedTrue(Long studentId, Long courseId);

    @Modifying
    @Query("delete from LessonProgress p where p.lesson.id = :lessonId")
    void deleteByLessonId(@Param("lessonId") Long lessonId);

    @Modifying
    @Query("delete from LessonProgress p where p.lesson.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("delete from LessonProgress p where p.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
}

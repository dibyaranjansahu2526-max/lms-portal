package com.lms.repository;

import com.lms.entity.Review;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = "student")
    List<Review> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    Optional<Review> findByStudentIdAndCourseId(Long studentId, Long courseId);

    @Query("select avg(r.rating) from Review r where r.course.id = :courseId")
    Double averageRating(@Param("courseId") Long courseId);

    long countByCourseId(Long courseId);

    @Modifying
    @Query("delete from Review r where r.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("delete from Review r where r.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
}

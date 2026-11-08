package com.lms.repository;

import com.lms.entity.Wishlist;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    @EntityGraph(attributePaths = {"course", "course.teacher"})
    List<Wishlist> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    Optional<Wishlist> findByStudentIdAndCourseId(Long studentId, Long courseId);

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    @Modifying
    @Query("delete from Wishlist w where w.student.id = :studentId and w.course.id = :courseId")
    void deleteByStudentIdAndCourseId(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Modifying
    @Query("delete from Wishlist w where w.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("delete from Wishlist w where w.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
}

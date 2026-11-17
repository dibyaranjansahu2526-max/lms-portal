package com.lms.repository;

import com.lms.entity.Enrollment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    @EntityGraph(attributePaths = {"course", "course.teacher"})
    List<Enrollment> findByStudentIdOrderByEnrolledAtDesc(Long studentId);

    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    @EntityGraph(attributePaths = "student")
    List<Enrollment> findByCourseIdOrderByEnrolledAtDesc(Long courseId);

    long countByCourseId(Long courseId);

    @Query("""
            select e.course.id as courseId,
                   count(e) as enrollmentCount,
                   sum(case when e.completed = true then 1 else 0 end) as completedCount
            from Enrollment e
            where e.course.teacher.id = :teacherId
            group by e.course.id
            """)
    List<CourseEnrollmentStats> findCourseStatsByTeacherId(@Param("teacherId") Long teacherId);

    @Modifying
    @Query("delete from Enrollment e where e.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("delete from Enrollment e where e.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);

    interface CourseEnrollmentStats {
        Long getCourseId();

        long getEnrollmentCount();

        long getCompletedCount();
    }
}

package com.lms.repository;

import com.lms.entity.Course;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {

    @EntityGraph(attributePaths = "teacher")
    @Query("""
            select distinct c from Course c
            where c.published = true
              and (:search is null
                   or lower(c.title) like lower(concat('%', :search, '%'))
                   or lower(c.description) like lower(concat('%', :search, '%')))
              and (:category is null or lower(c.category) = lower(:category))
            order by c.createdAt desc
            """)
    List<Course> searchPublished(@Param("search") String search, @Param("category") String category);

    @EntityGraph(attributePaths = "teacher")
    List<Course> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);

    @EntityGraph(attributePaths = "teacher")
    Optional<Course> findWithTeacherById(Long id);

    @Query("select distinct c.category from Course c where c.published = true and c.category is not null order by c.category")
    List<String> findPublishedCategories();

    long countByPublishedTrue();
}

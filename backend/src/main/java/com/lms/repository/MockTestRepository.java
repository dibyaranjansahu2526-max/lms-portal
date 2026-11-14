package com.lms.repository;

import com.lms.entity.MockTest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MockTestRepository extends JpaRepository<MockTest, Long> {

    List<MockTest> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);

    List<MockTest> findByPublishedTrueOrderByCreatedAtDesc();

    Optional<MockTest> findByTitleIgnoreCaseAndTeacherId(String title, Long teacherId);
}

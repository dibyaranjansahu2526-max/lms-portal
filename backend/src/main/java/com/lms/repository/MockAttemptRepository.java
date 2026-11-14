package com.lms.repository;

import com.lms.entity.MockAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MockAttemptRepository extends JpaRepository<MockAttempt, Long> {

    Optional<MockAttempt> findFirstByStudentIdAndMockTestIdAndStatusOrderByStartedAtDesc(
            Long studentId, Long mockTestId, String status);

    Optional<MockAttempt> findFirstByStudentIdAndMockTestIdAndSubmittedAtIsNotNullOrderByScoreDescTimeTakenSecondsAscSubmittedAtAsc(
            Long studentId, Long mockTestId);

    List<MockAttempt> findByStudentIdAndMockTestIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(
            Long studentId, Long mockTestId);

    List<MockAttempt> findByMockTestIdAndSubmittedAtIsNotNullOrderByScoreDescTimeTakenSecondsAscSubmittedAtAsc(
            Long mockTestId);

    long countByMockTestIdAndSubmittedAtIsNotNull(Long mockTestId);

    long countByStudentIdAndMockTestIdAndSubmittedAtIsNotNull(Long studentId, Long mockTestId);

    List<MockAttempt> findByStudentId(Long studentId);

    List<MockAttempt> findByMockTestId(Long mockTestId);
}

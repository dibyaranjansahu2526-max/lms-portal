package com.lms.repository;

import com.lms.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    List<Payment> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    @Modifying
    @Query("""
            update Payment p
            set p.couponUsageRecorded = true
            where p.id = :paymentId and p.couponUsageRecorded = false
            """)
    int markCouponUsageRecorded(@Param("paymentId") Long paymentId);

    @Modifying
    @Query("delete from Payment p where p.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("delete from Payment p where p.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
}

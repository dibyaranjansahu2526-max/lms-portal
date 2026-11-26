package com.lms.service;

import com.lms.dto.AdminPaymentDto;
import com.lms.dto.CourseRevenueDto;
import com.lms.dto.DailyRevenueDto;
import com.lms.entity.Course;
import com.lms.entity.Payment;
import com.lms.entity.PaymentStatus;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminRevenueServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private AdminRevenueService adminRevenueService;

    private Course javaCourse;
    private Course pythonCourse;
    private User student;

    @BeforeEach
    void setUp() {
        student = new User();
        student.setId(4L);
        student.setName("Aarav Mehta");
        student.setEmail("student1@lms.com");
        student.setRole(Role.STUDENT);

        javaCourse = new Course();
        javaCourse.setId(1L);
        javaCourse.setTitle("Java Programming Bootcamp");

        pythonCourse = new Course();
        pythonCourse.setId(2L);
        pythonCourse.setTitle("Python Programming Foundations");
    }

    @Test
    void sumsOnlySuccessfulPayments() {
        when(paymentRepository.findAll()).thenReturn(List.of(
                payment(1L, javaCourse, PaymentStatus.SUCCESS, 49_900L, LocalDateTime.now()),
                payment(2L, javaCourse, PaymentStatus.FAILED, 49_900L, LocalDateTime.now()),
                payment(3L, pythonCourse, PaymentStatus.CREATED, 39_900L, LocalDateTime.now())
        ));

        var summary = adminRevenueService.summary();

        assertThat(summary.totalRevenuePaise()).isEqualTo(49_900L);
        assertThat(summary.successfulPayments()).isEqualTo(1L);
    }

    @Test
    void groupsRevenueByCourseAndSortsByRevenueDescending() {
        when(paymentRepository.findAll()).thenReturn(List.of(
                payment(1L, pythonCourse, PaymentStatus.SUCCESS, 39_900L, LocalDateTime.now()),
                payment(2L, javaCourse, PaymentStatus.SUCCESS, 49_900L, LocalDateTime.now()),
                payment(3L, javaCourse, PaymentStatus.SUCCESS, 49_900L, LocalDateTime.now()),
                payment(4L, javaCourse, PaymentStatus.FAILED, 49_900L, LocalDateTime.now())
        ));

        List<CourseRevenueDto> result = adminRevenueService.byCourse();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).courseId()).isEqualTo(1L);
        assertThat(result.get(0).revenuePaise()).isEqualTo(99_800L);
        assertThat(result.get(0).successfulPayments()).isEqualTo(2L);
        assertThat(result.get(1).courseId()).isEqualTo(2L);
        assertThat(result.get(1).revenuePaise()).isEqualTo(39_900L);
    }

    @Test
    void returnsThirtyDaysIncludingDaysWithNoRevenue() {
        LocalDate today = LocalDate.now();
        when(paymentRepository.findAll()).thenReturn(List.of(
                payment(1L, javaCourse, PaymentStatus.SUCCESS, 49_900L, today.atTime(10, 0)),
                payment(2L, javaCourse, PaymentStatus.SUCCESS, 29_900L, today.minusDays(29).atTime(11, 0)),
                payment(3L, javaCourse, PaymentStatus.FAILED, 49_900L, today.atTime(12, 0))
        ));

        List<DailyRevenueDto> result = adminRevenueService.byDay();

        assertThat(result).hasSize(30);
        assertThat(result.get(0).date()).isEqualTo(today.minusDays(29));
        assertThat(result.get(0).revenuePaise()).isEqualTo(29_900L);
        assertThat(result.get(29).date()).isEqualTo(today);
        assertThat(result.get(29).revenuePaise()).isEqualTo(49_900L);
        assertThat(result.subList(1, 29)).allMatch(day -> day.revenuePaise() == 0L);
    }

    @Test
    void returnsTwentyMostRecentPaymentsIncludingAllStatuses() {
        List<Payment> payments = new ArrayList<>();
        LocalDateTime base = LocalDateTime.now();
        for (long id = 1; id <= 25; id++) {
            payments.add(payment(id, javaCourse, PaymentStatus.SUCCESS, 49_900L, base.plusMinutes(id)));
        }
        when(paymentRepository.findAll()).thenReturn(payments);

        List<AdminPaymentDto> result = adminRevenueService.recentPayments();

        assertThat(result).hasSize(20);
        assertThat(result.get(0).id()).isEqualTo(25L);
        assertThat(result.get(19).id()).isEqualTo(6L);
        assertThat(result.get(0).studentName()).isEqualTo("Aarav Mehta");
        assertThat(result.get(0).courseTitle()).isEqualTo("Java Programming Bootcamp");
        assertThat(result.get(0).status()).isEqualTo("SUCCESS");
    }

    private Payment payment(Long id, Course course, PaymentStatus status, long amount, LocalDateTime createdAt) {
        Payment payment = new Payment();
        payment.setId(id);
        payment.setStudent(student);
        payment.setCourse(course);
        payment.setRazorpayOrderId("order_" + id);
        payment.setRazorpayPaymentId("pay_" + id);
        payment.setAmount(amount);
        payment.setStatus(status);
        payment.setCreatedAt(createdAt);
        return payment;
    }
}
package com.lms.service;

import com.lms.dto.AdminPaymentDto;
import com.lms.dto.AdminRevenueDto;
import com.lms.dto.AdminRevenueSummaryDto;
import com.lms.dto.CourseRevenueDto;
import com.lms.dto.DailyRevenueDto;
import com.lms.entity.Course;
import com.lms.entity.Payment;
import com.lms.entity.PaymentStatus;
import com.lms.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminRevenueService {

    private static final int CHART_DAYS = 30;
    private static final int RECENT_LIMIT = 20;

    private final PaymentRepository paymentRepository;

    public AdminRevenueService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public AdminRevenueDto revenue() {
        List<Payment> payments = paymentRepository.findAll();
        AdminRevenueSummaryDto summary = summaryOf(payments);
        return new AdminRevenueDto(
                summary.totalRevenuePaise(),
                summary.successfulPayments(),
                byCourseOf(payments),
                byDayOf(payments),
                recentOf(payments)
        );
    }

    @Transactional(readOnly = true)
    public AdminRevenueSummaryDto summary() {
        return summaryOf(paymentRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<CourseRevenueDto> byCourse() {
        return byCourseOf(paymentRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<DailyRevenueDto> byDay() {
        return byDayOf(paymentRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<AdminPaymentDto> recentPayments() {
        return recentOf(paymentRepository.findAll());
    }

    private AdminRevenueSummaryDto summaryOf(List<Payment> payments) {
        List<Payment> successful = payments.stream().filter(AdminRevenueService::isSuccessful).toList();
        return new AdminRevenueSummaryDto(
                successful.stream().mapToLong(Payment::getAmount).sum(),
                successful.size()
        );
    }

    private List<CourseRevenueDto> byCourseOf(List<Payment> payments) {
        Map<Long, List<Payment>> grouped = payments.stream()
                .filter(AdminRevenueService::isSuccessful)
                .collect(Collectors.groupingBy(payment -> payment.getCourse().getId()));

        return grouped.entrySet().stream()
                .map(entry -> {
                    List<Payment> items = entry.getValue();
                    Course course = items.get(0).getCourse();
                    return new CourseRevenueDto(
                            course.getId(),
                            course.getTitle(),
                            items.stream().mapToLong(Payment::getAmount).sum(),
                            items.size()
                    );
                })
                .sorted(Comparator.comparingLong(CourseRevenueDto::revenuePaise).reversed()
                        .thenComparing(CourseRevenueDto::courseTitle))
                .toList();
    }

    private List<DailyRevenueDto> byDayOf(List<Payment> payments) {
        Map<LocalDate, Long> totals = payments.stream()
                .filter(AdminRevenueService::isSuccessful)
                .filter(payment -> payment.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        payment -> payment.getCreatedAt().toLocalDate(),
                        Collectors.summingLong(Payment::getAmount)
                ));

        LocalDate firstDay = LocalDate.now().minusDays(CHART_DAYS - 1L);
        List<DailyRevenueDto> result = new ArrayList<>(CHART_DAYS);
        for (int day = 0; day < CHART_DAYS; day++) {
            LocalDate date = firstDay.plusDays(day);
            result.add(new DailyRevenueDto(date, totals.getOrDefault(date, 0L)));
        }
        return result;
    }

    private List<AdminPaymentDto> recentOf(List<Payment> payments) {
        Comparator<Payment> newestFirst = Comparator.comparing(
                Payment::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())
        );
        return payments.stream()
                .sorted(newestFirst)
                .limit(RECENT_LIMIT)
                .map(payment -> new AdminPaymentDto(
                        payment.getId(),
                        payment.getStudent().getName(),
                        payment.getStudent().getEmail(),
                        payment.getCourse().getId(),
                        payment.getCourse().getTitle(),
                        payment.getAmount(),
                        payment.getStatus().name(),
                        payment.getCreatedAt()
                ))
                .toList();
    }

    private static boolean isSuccessful(Payment payment) {
        return payment.getStatus() == PaymentStatus.SUCCESS;
    }
}
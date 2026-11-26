package com.lms.controller;

import com.lms.dto.AdminPaymentDto;
import com.lms.dto.AdminRevenueDto;
import com.lms.dto.AdminRevenueSummaryDto;
import com.lms.dto.CourseRevenueDto;
import com.lms.dto.DailyRevenueDto;
import com.lms.service.AdminRevenueService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/revenue")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRevenueController {

    private final AdminRevenueService adminRevenueService;

    public AdminRevenueController(AdminRevenueService adminRevenueService) {
        this.adminRevenueService = adminRevenueService;
    }

    @GetMapping
    public AdminRevenueDto revenue() {
        return adminRevenueService.revenue();
    }

    @GetMapping("/summary")
    public AdminRevenueSummaryDto summary() {
        return adminRevenueService.summary();
    }

    @GetMapping("/courses")
    public List<CourseRevenueDto> courses() {
        return adminRevenueService.byCourse();
    }

    @GetMapping("/daily")
    public List<DailyRevenueDto> daily() {
        return adminRevenueService.byDay();
    }

    @GetMapping("/recent")
    public List<AdminPaymentDto> recent() {
        return adminRevenueService.recentPayments();
    }
}
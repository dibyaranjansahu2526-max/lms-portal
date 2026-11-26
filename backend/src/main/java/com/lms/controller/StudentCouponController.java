package com.lms.controller;

import com.lms.dto.CouponValidationDto;
import com.lms.dto.CouponValidationRequest;
import com.lms.service.CouponService;
import com.lms.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/coupons")
@PreAuthorize("hasRole('STUDENT')")
public class StudentCouponController {

    private final CouponService couponService;
    private final CurrentUserService currentUserService;

    public StudentCouponController(CouponService couponService, CurrentUserService currentUserService) {
        this.couponService = couponService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/validate")
    public CouponValidationDto validate(@Valid @RequestBody CouponValidationRequest request,
                                        Authentication authentication) {
        return couponService.validateForCourse(
                request.courseId(),
                currentUserService.get(authentication).getId(),
                request.code()
        );
    }
}
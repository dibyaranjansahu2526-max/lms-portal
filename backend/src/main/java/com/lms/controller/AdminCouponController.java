package com.lms.controller;

import com.lms.dto.CouponDto;
import com.lms.dto.CouponRequest;
import com.lms.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCouponController {

    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping
    public CouponDto create(@Valid @RequestBody CouponRequest request) {
        return couponService.create(request);
    }

    @GetMapping
    public List<CouponDto> list() {
        return couponService.list();
    }

    @PostMapping("/{couponId}/activate")
    public CouponDto activate(@PathVariable Long couponId) {
        return couponService.setActive(couponId, true);
    }

    @PostMapping("/{couponId}/deactivate")
    public CouponDto deactivate(@PathVariable Long couponId) {
        return couponService.setActive(couponId, false);
    }

    @DeleteMapping("/{couponId}")
    public void delete(@PathVariable Long couponId) {
        couponService.delete(couponId);
    }
}
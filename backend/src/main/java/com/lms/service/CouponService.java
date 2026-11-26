package com.lms.service;

import com.lms.dto.CouponDto;
import com.lms.dto.CouponRequest;
import com.lms.dto.CouponValidationDto;
import com.lms.entity.Coupon;
import com.lms.entity.Course;
import com.lms.exception.ApiException;
import com.lms.repository.CouponRepository;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CouponService {

    private static final Logger log = LoggerFactory.getLogger(CouponService.class);
    private static final long PAISE_PER_RUPEE = 100L;

    private final CouponRepository couponRepository;
    private final CourseService courseService;
    private final EnrollmentRepository enrollmentRepository;
    private final PaymentRepository paymentRepository;

    public CouponService(CouponRepository couponRepository,
                         CourseService courseService,
                         EnrollmentRepository enrollmentRepository,
                         PaymentRepository paymentRepository) {
        this.couponRepository = couponRepository;
        this.courseService = courseService;
        this.enrollmentRepository = enrollmentRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public CouponDto create(CouponRequest request) {
        String code = Coupon.normalize(request.code());
        if (code == null || code.isBlank()) {
            throw ApiException.badRequest("Coupon code is required.");
        }
        if (couponRepository.findByCode(code).isPresent()) {
            throw ApiException.conflict("Coupon code already exists.");
        }
        if (request.discountPercent() == null
                || request.discountPercent() < 1 || request.discountPercent() > 100) {
            throw ApiException.badRequest("Discount must be between 1 and 100 percent.");
        }
        if (request.maxUses() == null || request.maxUses() < 1) {
            throw ApiException.badRequest("Maximum uses must be at least 1.");
        }
        if (request.expiresAt() == null || !request.expiresAt().isAfter(LocalDateTime.now())) {
            throw ApiException.badRequest("Coupon expiry must be in the future.");
        }

        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setDiscountPercent(request.discountPercent());
        coupon.setExpiresAt(request.expiresAt());
        coupon.setMaxUses(request.maxUses());
        coupon.setUsedCount(0);
        coupon.setActive(request.active() == null || request.active());
        return toDto(couponRepository.save(coupon));
    }

    @Transactional(readOnly = true)
    public List<CouponDto> list() {
        return couponRepository.findAllByOrderByIdDesc().stream().map(this::toDto).toList();
    }

    @Transactional
    public CouponDto setActive(Long couponId, boolean active) {
        Coupon coupon = requireCoupon(couponId);
        coupon.setActive(active);
        return toDto(couponRepository.save(coupon));
    }

    @Transactional
    public void delete(Long couponId) {
        Coupon coupon = requireCoupon(couponId);
        couponRepository.delete(coupon);
    }

    @Transactional(readOnly = true)
    public CouponValidationDto validateForCourse(Long courseId, Long studentId, String rawCode) {
        return validate(courseService.findCourse(courseId), studentId, rawCode);
    }

    @Transactional(readOnly = true)
    public CouponValidationDto validate(Course course, Long studentId, String rawCode) {
        if (!course.isPublished()) {
            throw ApiException.badRequest("This course is not open for enrollment");
        }
        if (course.getPrice() <= 0) {
            throw ApiException.badRequest("Coupons can only be used for paid courses.");
        }
        if (studentId != null && enrollmentRepository.existsByStudentIdAndCourseId(studentId, course.getId())) {
            throw ApiException.conflict("You are already enrolled in this course");
        }

        String code = Coupon.normalize(rawCode);
        if (code == null || code.isBlank()) {
            throw ApiException.badRequest("Coupon code is required.");
        }

        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> ApiException.badRequest("Coupon code not found."));
        if (!coupon.isActive()) {
            throw ApiException.badRequest("This coupon is inactive.");
        }
        if (!coupon.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw ApiException.badRequest("This coupon has expired.");
        }
        if (coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw ApiException.badRequest("This coupon has reached its usage limit.");
        }

        return discountedPrice(code, coupon.getDiscountPercent(), course.getPrice());
    }

    @Transactional
    public void consumeOnce(Long paymentId, String rawCode) {
        String code = Coupon.normalize(rawCode);
        if (paymentId == null || code == null || code.isBlank()) {
            return;
        }
        if (paymentRepository.markCouponUsageRecorded(paymentId) == 0) {
            return;
        }
        int updated = couponRepository.incrementUsage(code);
        if (updated == 0) {
            log.warn("Coupon {} was not counted because its usage limit was reached", code);
        }
    }

    private CouponValidationDto discountedPrice(String code, int discountPercent, long price) {
        long originalPaise;
        try {
            originalPaise = Math.multiplyExact(price, PAISE_PER_RUPEE);
        } catch (ArithmeticException exception) {
            throw ApiException.badRequest("Course price is too large.");
        }
        long discountPaise = (originalPaise * discountPercent) / 100;
        long finalPaise = originalPaise - discountPaise;
        return new CouponValidationDto(
                code,
                discountPercent,
                originalPaise,
                discountPaise,
                finalPaise,
                finalPaise == 0
        );
    }

    private Coupon requireCoupon(Long couponId) {
        return couponRepository.findById(couponId)
                .orElseThrow(() -> ApiException.notFound("Coupon not found"));
    }

    private CouponDto toDto(Coupon coupon) {
        return new CouponDto(
                coupon.getId(),
                coupon.getCode(),
                coupon.getDiscountPercent(),
                coupon.getExpiresAt(),
                coupon.getMaxUses(),
                coupon.getUsedCount(),
                coupon.isActive(),
                Math.max(0, coupon.getMaxUses() - coupon.getUsedCount())
        );
    }
}
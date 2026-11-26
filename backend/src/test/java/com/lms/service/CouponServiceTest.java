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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private CourseService courseService;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private CouponService couponService;

    private Course course;
    private Coupon coupon;

    @BeforeEach
    void setUp() {
        course = new Course();
        course.setId(22L);
        course.setTitle("Paid Course");
        course.setPrice(499L);
        course.setPublished(true);

        coupon = new Coupon();
        coupon.setId(1L);
        coupon.setCode("SAVE10");
        coupon.setDiscountPercent(10);
        coupon.setExpiresAt(LocalDateTime.now().plusDays(1));
        coupon.setMaxUses(5);
        coupon.setUsedCount(0);
        coupon.setActive(true);
    }

    @Test
    void validCouponReturnsDiscountedPriceAndNormalizesCode() {
        when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));

        CouponValidationDto result = couponService.validate(course, 11L, " save10 ");

        assertThat(result.code()).isEqualTo("SAVE10");
        assertThat(result.discountPercent()).isEqualTo(10);
        assertThat(result.originalPricePaise()).isEqualTo(49_900L);
        assertThat(result.discountPaise()).isEqualTo(4_990L);
        assertThat(result.finalPricePaise()).isEqualTo(44_910L);
        assertThat(result.free()).isFalse();
    }

    @Test
    void hundredPercentCouponReturnsZeroPrice() {
        coupon.setDiscountPercent(100);
        when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));

        CouponValidationDto result = couponService.validate(course, 11L, "SAVE10");

        assertThat(result.discountPaise()).isEqualTo(49_900L);
        assertThat(result.finalPricePaise()).isZero();
        assertThat(result.free()).isTrue();
    }

    @Test
    void rejectsExpiredCoupon() {
        coupon.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> couponService.validate(course, 11L, "SAVE10"))
                .isInstanceOf(ApiException.class)
                .hasMessage("This coupon has expired.");
    }

    @Test
    void rejectsUsedUpCoupon() {
        coupon.setUsedCount(coupon.getMaxUses());
        when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> couponService.validate(course, 11L, "SAVE10"))
                .isInstanceOf(ApiException.class)
                .hasMessage("This coupon has reached its usage limit.");
    }

    @Test
    void rejectsInactiveCoupon() {
        coupon.setActive(false);
        when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));

        assertThatThrownBy(() -> couponService.validate(course, 11L, "SAVE10"))
                .isInstanceOf(ApiException.class)
                .hasMessage("This coupon is inactive.");
    }

    @Test
    void rejectsUnknownCoupon() {
        when(couponRepository.findByCode("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> couponService.validate(course, 11L, "missing"))
                .isInstanceOf(ApiException.class)
                .hasMessage("Coupon code not found.");
    }

    @Test
    void rejectsCouponForFreeCourse() {
        course.setPrice(0);

        assertThatThrownBy(() -> couponService.validate(course, 11L, "SAVE10"))
                .isInstanceOf(ApiException.class)
                .hasMessage("Coupons can only be used for paid courses.");
    }

    @Test
    void createStoresCodeUppercase() {
        when(couponRepository.findByCode("SAVE20")).thenReturn(Optional.empty());
        when(couponRepository.save(any(Coupon.class))).thenAnswer(invocation -> {
            Coupon saved = invocation.getArgument(0);
            saved.setId(2L);
            return saved;
        });

        CouponDto result = couponService.create(
                new CouponRequest("save20", 20, LocalDateTime.now().plusDays(2), 10, null));

        assertThat(result.code()).isEqualTo("SAVE20");
        assertThat(result.discountPercent()).isEqualTo(20);
        assertThat(result.remainingUses()).isEqualTo(10);
        assertThat(result.active()).isTrue();
        ArgumentCaptor<Coupon> captor = ArgumentCaptor.forClass(Coupon.class);
        verify(couponRepository).save(captor.capture());
        assertThat(captor.getValue().getCode()).isEqualTo("SAVE20");
    }

    @Test
    void rejectsInvalidDiscountPercentOnCreate() {
        assertThatThrownBy(() -> couponService.create(
                new CouponRequest("BAD", 0, LocalDateTime.now().plusDays(1), 10, null)))
                .isInstanceOf(ApiException.class)
                .hasMessage("Discount must be between 1 and 100 percent.");
        verify(couponRepository, never()).save(any());
    }

    @Test
    void countsCouponUsageOnlyOncePerPayment() {
        when(paymentRepository.markCouponUsageRecorded(1L)).thenReturn(1, 0);
        when(couponRepository.incrementUsage("SAVE10")).thenReturn(1);

        couponService.consumeOnce(1L, "SAVE10");
        couponService.consumeOnce(1L, "SAVE10");

        verify(couponRepository, times(1)).incrementUsage("SAVE10");
    }
}
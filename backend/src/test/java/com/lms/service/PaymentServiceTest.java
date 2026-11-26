package com.lms.service;

import com.lms.dto.CouponValidationDto;
import com.lms.dto.CreatePaymentOrderRequest;
import com.lms.dto.EnrolledCourseDto;
import com.lms.dto.PaymentDto;
import com.lms.dto.PaymentOrderDto;
import com.lms.dto.PaymentVerificationDto;
import com.lms.dto.VerifyPaymentRequest;
import com.lms.entity.Course;
import com.lms.entity.Payment;
import com.lms.entity.PaymentStatus;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.PaymentRepository;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    private static final long STUDENT_ID = 11L;
    private static final long COURSE_ID = 22L;
    private static final long ENROLLMENT_ID = 33L;
    private static final String ORDER_ID = "order_test_" + UUID.randomUUID();
    private static final String PAYMENT_ID = "pay_test_" + UUID.randomUUID();
    private static final String SIGNATURE = "signature_" + UUID.randomUUID();

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private EnrollmentService enrollmentService;

    @Mock
    private CourseService courseService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private RazorpayOrderClient razorpayOrderClient;

    @Mock
    private RazorpaySignatureVerifier signatureVerifier;

    @Mock
    private CouponService couponService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private PaymentService paymentService;

    private User student;
    private Course course;
    private Payment payment;

    @BeforeEach
    void setUp() {
        student = new User();
        student.setId(STUDENT_ID);
        student.setName("Test Student");
        student.setEmail("student@example.com");
        student.setRole(Role.STUDENT);

        course = new Course();
        course.setId(COURSE_ID);
        course.setTitle("Paid Course");
        course.setPrice(499L);
        course.setPublished(true);

        payment = new Payment();
        payment.setId(1L);
        payment.setStudent(student);
        payment.setCourse(course);
        payment.setRazorpayOrderId(ORDER_ID);
        payment.setAmount(49_900L);
        payment.setStatus(PaymentStatus.CREATED);
    }

    @Test
    void createsARazorpayOrderForTheCoursePriceInPaise() {
        when(currentUserService.get(authentication)).thenReturn(student);
        when(courseService.findCourse(COURSE_ID)).thenReturn(course);
        when(enrollmentRepository.existsByStudentIdAndCourseId(STUDENT_ID, COURSE_ID)).thenReturn(false);
        when(razorpayOrderClient.createOrder(eq(49_900L), anyString()))
                .thenReturn(new RazorpayOrderClient.RazorpayOrder(ORDER_ID, 49_900L, "INR"));
        when(razorpayOrderClient.getKeyId()).thenReturn("generated-key-" + UUID.randomUUID());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentOrderDto result = paymentService.createOrder(
                new CreatePaymentOrderRequest(COURSE_ID, null), authentication);

        assertThat(result.orderId()).isEqualTo(ORDER_ID);
        assertThat(result.amount()).isEqualTo(49_900L);
        assertThat(result.currency()).isEqualTo("INR");
        assertThat(result.keyId()).startsWith("generated-key-");

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        Payment saved = paymentCaptor.getValue();
        assertThat(saved.getStudent()).isSameAs(student);
        assertThat(saved.getCourse()).isSameAs(course);
        assertThat(saved.getRazorpayOrderId()).isEqualTo(ORDER_ID);
        assertThat(saved.getAmount()).isEqualTo(49_900L);
        assertThat(saved.getStatus()).isEqualTo(PaymentStatus.CREATED);
        assertThat(saved.getRazorpayPaymentId()).isNull();
    }

    @Test
    void verifiesTheSignatureMarksThePaymentSuccessfulAndEnrollsTheStudent() {
        when(currentUserService.get(authentication)).thenReturn(student);
        when(paymentRepository.findByRazorpayOrderId(ORDER_ID)).thenReturn(Optional.of(payment));
        when(signatureVerifier.isValid(ORDER_ID, PAYMENT_ID, SIGNATURE)).thenReturn(true);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(enrollmentService.enrollAfterPayment(course, student)).thenReturn(enrolledCourse());

        PaymentVerificationDto result = paymentService.verifyPayment(
                new VerifyPaymentRequest(ORDER_ID, PAYMENT_ID, SIGNATURE), authentication);

        assertThat(result.status()).isEqualTo(PaymentStatus.SUCCESS.name());
        assertThat(result.enrollmentId()).isEqualTo(ENROLLMENT_ID);
        assertThat(result.courseId()).isEqualTo(COURSE_ID);
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(payment.getRazorpayPaymentId()).isEqualTo(PAYMENT_ID);
        verify(paymentRepository).save(payment);
        verify(enrollmentService).enrollAfterPayment(course, student);
    }

    @Test
    void verifyingTheSamePaymentTwiceDoesNotSaveASecondSuccess() {
        when(currentUserService.get(authentication)).thenReturn(student);
        when(paymentRepository.findByRazorpayOrderId(ORDER_ID)).thenReturn(Optional.of(payment));
        when(signatureVerifier.isValid(ORDER_ID, PAYMENT_ID, SIGNATURE)).thenReturn(true);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(enrollmentService.enrollAfterPayment(course, student)).thenReturn(enrolledCourse());

        paymentService.verifyPayment(new VerifyPaymentRequest(ORDER_ID, PAYMENT_ID, SIGNATURE), authentication);
        paymentService.verifyPayment(new VerifyPaymentRequest(ORDER_ID, PAYMENT_ID, SIGNATURE), authentication);

        verify(paymentRepository, times(1)).save(payment);
        verify(enrollmentService, times(2)).enrollAfterPayment(course, student);
    }

    @Test
    void rejectsAnInvalidSignatureWithoutEnrolling() {
        when(currentUserService.get(authentication)).thenReturn(student);
        when(paymentRepository.findByRazorpayOrderId(ORDER_ID)).thenReturn(Optional.of(payment));
        when(signatureVerifier.isValid(ORDER_ID, PAYMENT_ID, SIGNATURE)).thenReturn(false);
        when(paymentRepository.save(payment)).thenReturn(payment);

        assertThatThrownBy(() -> paymentService.verifyPayment(
                new VerifyPaymentRequest(ORDER_ID, PAYMENT_ID, SIGNATURE), authentication))
                .isInstanceOf(ApiException.class)
                .hasMessage("Payment signature verification failed")
                .satisfies(error -> assertThat(((ApiException) error).getStatus())
                        .isEqualTo(HttpStatus.BAD_REQUEST));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);
        verify(paymentRepository).save(payment);
        verify(enrollmentService, never()).enrollAfterPayment(any(), any());
    }

    @Test
    void doesNotCreatePaidOrdersForFreeCourses() {
        course.setPrice(0);
        when(currentUserService.get(authentication)).thenReturn(student);
        when(courseService.findCourse(COURSE_ID)).thenReturn(course);

        assertThatThrownBy(() -> paymentService.createOrder(
                new CreatePaymentOrderRequest(COURSE_ID, null), authentication))
                .isInstanceOf(ApiException.class)
                .hasMessage("This course is free. Use the enroll endpoint to join it.");

        verifyNoInteractions(razorpayOrderClient);
    }

    @Test
    void doesNotCreateOrdersForCoursesTheStudentAlreadyHas() {
        when(currentUserService.get(authentication)).thenReturn(student);
        when(courseService.findCourse(COURSE_ID)).thenReturn(course);
        when(enrollmentRepository.existsByStudentIdAndCourseId(STUDENT_ID, COURSE_ID)).thenReturn(true);

        assertThatThrownBy(() -> paymentService.createOrder(
                new CreatePaymentOrderRequest(COURSE_ID, null), authentication))
                .isInstanceOf(ApiException.class)
                .hasMessage("You are already enrolled in this course");

        verifyNoInteractions(razorpayOrderClient);
    }

    @Test
    void listsPaymentsForTheCurrentStudent() {
        payment.setRazorpayPaymentId(PAYMENT_ID);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setCreatedAt(LocalDateTime.now());
        when(currentUserService.get(authentication)).thenReturn(student);
        when(paymentRepository.findByStudentIdOrderByCreatedAtDesc(STUDENT_ID))
                .thenReturn(List.of(payment));

        List<PaymentDto> result = paymentService.getPayments(authentication);

        assertThat(result).hasSize(1);
        PaymentDto dto = result.get(0);
        assertThat(dto.courseId()).isEqualTo(COURSE_ID);
        assertThat(dto.courseTitle()).isEqualTo("Paid Course");
        assertThat(dto.razorpayOrderId()).isEqualTo(ORDER_ID);
        assertThat(dto.razorpayPaymentId()).isEqualTo(PAYMENT_ID);
        assertThat(dto.amountPaise()).isEqualTo(49_900L);
        assertThat(dto.status()).isEqualTo("SUCCESS");
        assertThat(dto.createdAt()).isEqualTo(payment.getCreatedAt());
    }
    @Test
    void generatesReceiptForOwnSuccessfulPayment() {
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setRazorpayPaymentId(PAYMENT_ID);
        payment.setCreatedAt(LocalDateTime.now());
        when(currentUserService.get(authentication)).thenReturn(student);
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));

        PaymentService.PaymentPdf result = paymentService.generateReceipt(1L, authentication);

        assertThat(result.filename()).isEqualTo("LMS-Receipt-1.pdf");
        assertThat(new String(result.bytes(), 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    void receiptIncludesCouponAndDiscount() throws Exception {
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setRazorpayPaymentId(PAYMENT_ID);
        payment.setCreatedAt(LocalDateTime.now());
        payment.setCouponCode("SAVE10");
        payment.setOriginalAmountPaise(49_900L);
        payment.setDiscountPaise(4_990L);
        payment.setAmount(44_910L);
        when(currentUserService.get(authentication)).thenReturn(student);
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));

        PaymentService.PaymentPdf result = paymentService.generateReceipt(1L, authentication);

        String text = extractPdfText(result.bytes());
        assertThat(text).contains("SAVE10");
        assertThat(text).contains("Discount");
        assertThat(text).contains("Amount paid");
        assertThat(text).contains("INR 449");
    }

    @Test
    void refusesReceiptForAnotherStudentsPayment() {
        User other = new User();
        other.setId(99L);
        payment.setStudent(other);
        when(currentUserService.get(authentication)).thenReturn(student);
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.generateReceipt(1L, authentication))
                .isInstanceOf(ApiException.class)
                .hasMessage("You can only download receipts for your own payments");
    }

    @Test
    void refusesReceiptForUnsuccessfulPayment() {
        when(currentUserService.get(authentication)).thenReturn(student);
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.generateReceipt(1L, authentication))
                .isInstanceOf(ApiException.class)
                .hasMessage("Receipt is available for successful payments only");
    }
    @Test
    void appliesCouponDiscountServerSideWhenCreatingAnOrder() {
        when(currentUserService.get(authentication)).thenReturn(student);
        when(courseService.findCourse(COURSE_ID)).thenReturn(course);
        when(enrollmentRepository.existsByStudentIdAndCourseId(STUDENT_ID, COURSE_ID)).thenReturn(false);
        when(couponService.validate(course, STUDENT_ID, "save10"))
                .thenReturn(new CouponValidationDto("SAVE10", 10, 49_900L, 4_990L, 44_910L, false));
        when(razorpayOrderClient.createOrder(eq(44_910L), anyString()))
                .thenReturn(new RazorpayOrderClient.RazorpayOrder(ORDER_ID, 44_910L, "INR"));
        when(razorpayOrderClient.getKeyId()).thenReturn("generated-key-" + UUID.randomUUID());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentOrderDto result = paymentService.createOrder(
                new CreatePaymentOrderRequest(COURSE_ID, "save10"), authentication);

        assertThat(result.amount()).isEqualTo(44_910L);
        assertThat(result.couponCode()).isEqualTo("SAVE10");
        assertThat(result.discountPaise()).isEqualTo(4_990L);
        verify(razorpayOrderClient).createOrder(eq(44_910L), anyString());
        verify(couponService, never()).consumeOnce(any(), anyString());

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        Payment saved = captor.getValue();
        assertThat(saved.getAmount()).isEqualTo(44_910L);
        assertThat(saved.getOriginalAmountPaise()).isEqualTo(49_900L);
        assertThat(saved.getDiscountPaise()).isEqualTo(4_990L);
        assertThat(saved.getCouponCode()).isEqualTo("SAVE10");
    }

    @Test
    void enrollsDirectlyWhenCouponMakesTheCourseFree() {
        when(currentUserService.get(authentication)).thenReturn(student);
        when(courseService.findCourse(COURSE_ID)).thenReturn(course);
        when(enrollmentRepository.existsByStudentIdAndCourseId(STUDENT_ID, COURSE_ID)).thenReturn(false);
        when(couponService.validate(course, STUDENT_ID, "free100"))
                .thenReturn(new CouponValidationDto("FREE100", 100, 49_900L, 49_900L, 0L, true));
        when(enrollmentService.enrollAfterPayment(course, student)).thenReturn(enrolledCourse());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment saved = invocation.getArgument(0);
            saved.setId(7L);
            return saved;
        });

        PaymentOrderDto result = paymentService.createOrder(
                new CreatePaymentOrderRequest(COURSE_ID, "free100"), authentication);

        assertThat(result.directEnrollment()).isTrue();
        assertThat(result.enrollmentId()).isEqualTo(ENROLLMENT_ID);
        assertThat(result.amount()).isZero();
        assertThat(result.keyId()).isEmpty();
        verifyNoInteractions(razorpayOrderClient);
        verify(enrollmentService).enrollAfterPayment(course, student);
        verify(couponService).consumeOnce(7L, "FREE100");

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        Payment saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(saved.getAmount()).isZero();
        assertThat(saved.getCouponCode()).isEqualTo("FREE100");
        assertThat(saved.getDiscountPaise()).isEqualTo(49_900L);
    }

    @Test
    void countsCouponUsageOnlyOnceWhenVerificationIsRetried() {
        payment.setCouponCode("SAVE10");
        when(currentUserService.get(authentication)).thenReturn(student);
        when(paymentRepository.findByRazorpayOrderId(ORDER_ID)).thenReturn(Optional.of(payment));
        when(signatureVerifier.isValid(ORDER_ID, PAYMENT_ID, SIGNATURE)).thenReturn(true);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(enrollmentService.enrollAfterPayment(course, student)).thenReturn(enrolledCourse());

        paymentService.verifyPayment(new VerifyPaymentRequest(ORDER_ID, PAYMENT_ID, SIGNATURE), authentication);
        paymentService.verifyPayment(new VerifyPaymentRequest(ORDER_ID, PAYMENT_ID, SIGNATURE), authentication);

        verify(couponService, times(1)).consumeOnce(1L, "SAVE10");
    }

    private String extractPdfText(byte[] bytes) throws Exception {
        PdfReader reader = new PdfReader(bytes);
        try {
            StringBuilder text = new StringBuilder();
            PdfTextExtractor extractor = new PdfTextExtractor(reader);
            for (int page = 1; page <= reader.getNumberOfPages(); page++) {
                text.append(extractor.getTextFromPage(page));
            }
            return text.toString();
        } finally {
            reader.close();
        }
    }

    private EnrolledCourseDto enrolledCourse() {
        return new EnrolledCourseDto(ENROLLMENT_ID, null, LocalDateTime.now(), null);
    }
}

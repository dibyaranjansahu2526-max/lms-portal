package com.lms.service;

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
                new CreatePaymentOrderRequest(COURSE_ID), authentication);

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
                new CreatePaymentOrderRequest(COURSE_ID), authentication))
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
                new CreatePaymentOrderRequest(COURSE_ID), authentication))
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
    private EnrolledCourseDto enrolledCourse() {
        return new EnrolledCourseDto(ENROLLMENT_ID, null, LocalDateTime.now(), null);
    }
}

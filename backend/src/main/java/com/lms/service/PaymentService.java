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
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.PaymentRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private static final long PAISE_PER_RUPEE = 100L;

    private final PaymentRepository paymentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;
    private final CourseService courseService;
    private final CurrentUserService currentUserService;
    private final RazorpayOrderClient razorpayOrderClient;
    private final RazorpaySignatureVerifier signatureVerifier;

    public PaymentService(PaymentRepository paymentRepository,
                          EnrollmentRepository enrollmentRepository,
                          EnrollmentService enrollmentService,
                          CourseService courseService,
                          CurrentUserService currentUserService,
                          RazorpayOrderClient razorpayOrderClient,
                          RazorpaySignatureVerifier signatureVerifier) {
        this.paymentRepository = paymentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.enrollmentService = enrollmentService;
        this.courseService = courseService;
        this.currentUserService = currentUserService;
        this.razorpayOrderClient = razorpayOrderClient;
        this.signatureVerifier = signatureVerifier;
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getPayments(Authentication authentication) {
        User student = currentUserService.get(authentication);
        return paymentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(payment -> new PaymentDto(
                        payment.getId(),
                        payment.getRazorpayOrderId(),
                        payment.getRazorpayPaymentId(),
                        payment.getCourse().getId(),
                        payment.getCourse().getTitle(),
                        payment.getAmount(),
                        payment.getStatus().name(),
                        payment.getCreatedAt()
                ))
                .toList();
    }
    @Transactional
    public PaymentOrderDto createOrder(CreatePaymentOrderRequest request, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Course course = courseService.findCourse(request.courseId());

        if (!course.isPublished()) {
            throw ApiException.badRequest("This course is not open for enrollment");
        }
        if (course.getPrice() <= 0) {
            throw ApiException.badRequest("This course is free. Use the enroll endpoint to join it.");
        }
        if (enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())) {
            throw ApiException.conflict("You are already enrolled in this course");
        }

        long amountInPaise = toPaise(course.getPrice());
        String receipt = "course-" + course.getId() + "-"
                + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        RazorpayOrderClient.RazorpayOrder order = razorpayOrderClient.createOrder(amountInPaise, receipt);

        Payment payment = new Payment();
        payment.setStudent(student);
        payment.setCourse(course);
        payment.setRazorpayOrderId(order.id());
        payment.setAmount(order.amount());
        payment.setStatus(PaymentStatus.CREATED);
        paymentRepository.save(payment);

        return new PaymentOrderDto(
                order.id(),
                order.amount(),
                order.currency(),
                razorpayOrderClient.getKeyId()
        );
    }

    @Transactional
    public PaymentVerificationDto verifyPayment(VerifyPaymentRequest request, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Payment payment = paymentRepository.findByRazorpayOrderId(request.razorpayOrderId())
                .orElseThrow(() -> ApiException.notFound("Payment order not found"));

        if (!payment.getStudent().getId().equals(student.getId())) {
            throw ApiException.forbidden("You can only verify your own payments");
        }

        boolean signatureValid = signatureVerifier.isValid(
                request.razorpayOrderId(),
                request.razorpayPaymentId(),
                request.razorpaySignature()
        );
        if (!signatureValid) {
            if (payment.getStatus() != PaymentStatus.SUCCESS) {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setRazorpayPaymentId(request.razorpayPaymentId());
                paymentRepository.save(payment);
            }
            throw ApiException.badRequest("Payment signature verification failed");
        }

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setRazorpayPaymentId(request.razorpayPaymentId());
            paymentRepository.save(payment);
        }

        EnrolledCourseDto enrollment = enrollmentService.enrollAfterPayment(payment.getCourse(), student);
        return new PaymentVerificationDto(
                PaymentStatus.SUCCESS.name(),
                payment.getRazorpayOrderId(),
                payment.getRazorpayPaymentId(),
                payment.getCourse().getId(),
                enrollment.enrollmentId()
        );
    }

    private long toPaise(long price) {
        try {
            return Math.multiplyExact(price, PAISE_PER_RUPEE);
        } catch (ArithmeticException exception) {
            throw ApiException.badRequest("Course price is too large.");
        }
    }
}

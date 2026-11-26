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
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PaymentService {

    private static final long PAISE_PER_RUPEE = 100L;
    private static final Color INDIGO = new Color(67, 56, 202);
    private static final Color SLATE = new Color(51, 65, 85);
    private static final Font RECEIPT_LABEL = new Font(Font.HELVETICA, 10, Font.BOLD, SLATE);
    private static final Font RECEIPT_VALUE = new Font(Font.HELVETICA, 11, Font.NORMAL, SLATE);

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
    @Transactional(readOnly = true)
    public PaymentPdf generateReceipt(Long paymentId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> ApiException.notFound("Payment not found"));

        if (!payment.getStudent().getId().equals(student.getId())) {
            throw ApiException.forbidden("You can only download receipts for your own payments");
        }
        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw ApiException.badRequest("Receipt is available for successful payments only");
        }

        byte[] pdf = renderReceipt(student, payment);
        return new PaymentPdf(pdf, "LMS-Receipt-" + payment.getId() + ".pdf");
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

    private byte[] renderReceipt(User student, Payment payment) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 60, 60, 60, 60);
        try {
            PdfWriter.getInstance(document, output);
            document.open();

            Paragraph brand = new Paragraph("LMS PORTAL", new Font(Font.HELVETICA, 12, Font.BOLD, INDIGO));
            brand.setAlignment(Element.ALIGN_CENTER);
            document.add(brand);

            Paragraph title = new Paragraph("Payment Receipt", new Font(Font.HELVETICA, 28, Font.BOLD, SLATE));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(24);
            title.setSpacingAfter(8);
            document.add(title);

            Paragraph intro = new Paragraph("Thank you for your purchase.",
                    new Font(Font.HELVETICA, 11, Font.NORMAL, SLATE));
            intro.setAlignment(Element.ALIGN_CENTER);
            document.add(intro);

            PdfPTable details = new PdfPTable(2);
            details.setWidthPercentage(100);
            details.setSpacingBefore(24);
            details.setSpacingAfter(24);
            addReceiptRow(details, "Receipt No.", "RCP-" + payment.getId());
            addReceiptRow(details, "Order ID", payment.getRazorpayOrderId());
            addReceiptRow(details, "Payment ID", payment.getRazorpayPaymentId() == null
                    ? "N/A" : payment.getRazorpayPaymentId());
            addReceiptRow(details, "Student", student.getName());
            addReceiptRow(details, "Email", student.getEmail());
            addReceiptRow(details, "Course", payment.getCourse().getTitle());
            addReceiptRow(details, "Amount", "INR " + String.format(Locale.ROOT, "%,d", payment.getAmount() / PAISE_PER_RUPEE));
            addReceiptRow(details, "Status", payment.getStatus().name());
            addReceiptRow(details, "Date", payment.getCreatedAt() == null
                    ? "N/A" : payment.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMMM yyyy, HH:mm")));
            document.add(details);

            Paragraph note = new Paragraph("This receipt is a record of a successful payment made through LMS Portal.",
                    new Font(Font.HELVETICA, 9, Font.ITALIC, new Color(100, 116, 139)));
            note.setAlignment(Element.ALIGN_CENTER);
            document.add(note);

            document.close();
            return output.toByteArray();
        } catch (Exception exception) {
            if (document.isOpen()) {
                document.close();
            }
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate payment receipt");
        }
    }

    private static void addReceiptRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, RECEIPT_LABEL));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(6f);
        PdfPCell valueCell = new PdfPCell(new Phrase(value == null ? "" : value, RECEIPT_VALUE));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(6f);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    public record PaymentPdf(byte[] bytes, String filename) {
    }
    private long toPaise(long price) {
        try {
            return Math.multiplyExact(price, PAISE_PER_RUPEE);
        } catch (ArithmeticException exception) {
            throw ApiException.badRequest("Course price is too large.");
        }
    }
}

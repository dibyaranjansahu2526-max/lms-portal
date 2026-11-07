package com.lms.service;

import com.lms.dto.ProgressDto;
import com.lms.entity.Course;
import com.lms.entity.Enrollment;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.EnrollmentRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class CertificateService {

    private static final Color INDIGO = new Color(67, 56, 202);
    private static final Color SLATE = new Color(51, 65, 85);
    private static final Color LIGHT = new Color(224, 231, 255);

    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;
    private final CourseService courseService;
    private final CurrentUserService currentUserService;

    public CertificateService(EnrollmentRepository enrollmentRepository,
                              EnrollmentService enrollmentService,
                              CourseService courseService,
                              CurrentUserService currentUserService) {
        this.enrollmentRepository = enrollmentRepository;
        this.enrollmentService = enrollmentService;
        this.courseService = courseService;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public CertificatePdf generate(Long courseId, Authentication authentication) {
        User student = currentUserService.get(authentication);
        Course course = courseService.findCourse(courseId);
        ProgressDto progress = enrollmentService.evaluateCompletion(student, course);
        if (!progress.completed() || progress.certificateCode() == null) {
            throw ApiException.badRequest("Complete all lessons and pass all quizzes to unlock your certificate");
        }

        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(student.getId(), courseId)
                .orElseThrow(() -> ApiException.notFound("Enrollment not found"));
        LocalDateTime completedAt = enrollment.getCompletedAt() == null
                ? LocalDateTime.now()
                : enrollment.getCompletedAt();

        byte[] pdf = renderPdf(student.getName(), course.getTitle(), completedAt, progress.certificateCode());
        String filename = "LMS-Certificate-" + courseId + ".pdf";
        return new CertificatePdf(pdf, filename);
    }

    private byte[] renderPdf(String studentName, String courseName, LocalDateTime completedAt, String code) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 60, 60, 50, 50);
        try {
            PdfWriter writer = PdfWriter.getInstance(document, output);
            document.open();

            Rectangle page = document.getPageSize();
            PdfContentByte canvas = writer.getDirectContent();
            canvas.setColorStroke(INDIGO);
            canvas.setLineWidth(3f);
            canvas.rectangle(26, 26, page.getWidth() - 52, page.getHeight() - 52);
            canvas.stroke();
            canvas.setColorStroke(LIGHT);
            canvas.setLineWidth(1f);
            canvas.rectangle(36, 36, page.getWidth() - 72, page.getHeight() - 72);
            canvas.stroke();

            Paragraph brand = new Paragraph("LMS PORTAL", new Font(Font.HELVETICA, 12, Font.BOLD, INDIGO));
            brand.setAlignment(Element.ALIGN_CENTER);
            brand.setSpacingBefore(35);
            document.add(brand);

            Paragraph title = new Paragraph("Certificate of Completion",
                    new Font(Font.HELVETICA, 34, Font.BOLD, SLATE));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(30);
            title.setSpacingAfter(20);
            document.add(title);

            Paragraph subtitle = new Paragraph("This certificate is proudly presented to",
                    new Font(Font.HELVETICA, 14, Font.NORMAL, SLATE));
            subtitle.setAlignment(Element.ALIGN_CENTER);
            document.add(subtitle);

            Paragraph name = new Paragraph(studentName, new Font(Font.HELVETICA, 30, Font.BOLD, INDIGO));
            name.setAlignment(Element.ALIGN_CENTER);
            name.setSpacingBefore(18);
            name.setSpacingAfter(18);
            document.add(name);

            Paragraph body = new Paragraph("for successfully completing the course",
                    new Font(Font.HELVETICA, 14, Font.NORMAL, SLATE));
            body.setAlignment(Element.ALIGN_CENTER);
            document.add(body);

            Paragraph course = new Paragraph(courseName, new Font(Font.HELVETICA, 23, Font.BOLD, SLATE));
            course.setAlignment(Element.ALIGN_CENTER);
            course.setSpacingBefore(14);
            course.setSpacingAfter(24);
            document.add(course);

            String dateText = completedAt.format(DateTimeFormatter.ofPattern("dd MMMM yyyy"));
            Paragraph details = new Paragraph("Completed on " + dateText + "     |     Certificate Code: " + code,
                    new Font(Font.HELVETICA, 11, Font.NORMAL, SLATE));
            details.setAlignment(Element.ALIGN_CENTER);
            document.add(details);

            Paragraph verify = new Paragraph("Verify this certificate using the unique code above.",
                    new Font(Font.HELVETICA, 9, Font.ITALIC, new Color(100, 116, 139)));
            verify.setAlignment(Element.ALIGN_CENTER);
            verify.setSpacingBefore(28);
            document.add(verify);

            document.close();
            return output.toByteArray();
        } catch (Exception ex) {
            if (document.isOpen()) {
                document.close();
            }
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not generate certificate");
        }
    }

    public record CertificatePdf(byte[] bytes, String filename) {
    }
}

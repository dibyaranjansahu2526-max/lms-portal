package com.lms.controller;

import com.lms.dto.CreatePaymentOrderRequest;
import com.lms.dto.PaymentDto;
import com.lms.dto.PaymentOrderDto;
import com.lms.dto.PaymentVerificationDto;
import com.lms.dto.VerifyPaymentRequest;
import com.lms.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student/payments")
@PreAuthorize("hasRole('STUDENT')")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public List<PaymentDto> listPayments(Authentication authentication) {
        return paymentService.getPayments(authentication);
    }

    @GetMapping("/{paymentId}/receipt")
    public ResponseEntity<byte[]> receipt(@PathVariable Long paymentId, Authentication authentication) {
        PaymentService.PaymentPdf receipt = paymentService.generateReceipt(paymentId, authentication);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename(receipt.filename()).build());
        headers.setContentLength(receipt.bytes().length);
        return ResponseEntity.ok().headers(headers).body(receipt.bytes());
    }
    @PostMapping("/create-order")
    public PaymentOrderDto createOrder(@Valid @RequestBody CreatePaymentOrderRequest request,
                                       Authentication authentication) {
        return paymentService.createOrder(request, authentication);
    }

    @PostMapping("/verify")
    public PaymentVerificationDto verify(@Valid @RequestBody VerifyPaymentRequest request,
                                         Authentication authentication) {
        return paymentService.verifyPayment(request, authentication);
    }
}

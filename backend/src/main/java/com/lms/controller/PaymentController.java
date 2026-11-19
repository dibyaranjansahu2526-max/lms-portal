package com.lms.controller;

import com.lms.dto.CreatePaymentOrderRequest;
import com.lms.dto.PaymentOrderDto;
import com.lms.dto.PaymentVerificationDto;
import com.lms.dto.VerifyPaymentRequest;
import com.lms.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/payments")
@PreAuthorize("hasRole('STUDENT')")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
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

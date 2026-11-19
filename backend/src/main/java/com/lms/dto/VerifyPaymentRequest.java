package com.lms.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record VerifyPaymentRequest(
        @JsonAlias({"orderId", "razorpay_order_id"})
        @NotBlank(message = "Razorpay order id is required")
        String razorpayOrderId,

        @JsonAlias({"paymentId", "razorpay_payment_id"})
        @NotBlank(message = "Razorpay payment id is required")
        String razorpayPaymentId,

        @JsonAlias({"signature", "razorpay_signature"})
        @NotBlank(message = "Razorpay signature is required")
        String razorpaySignature
) {
}

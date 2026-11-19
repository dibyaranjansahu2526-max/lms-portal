package com.lms.service;

import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class RazorpaySignatureVerifierTest {

    @Test
    void acceptsSignatureGeneratedWithTheConfiguredSecret() throws Exception {
        String secret = generatedSecret();
        RazorpaySignatureVerifier verifier = new RazorpaySignatureVerifier(secret);
        String orderId = "order_" + UUID.randomUUID();
        String paymentId = "pay_" + UUID.randomUUID();

        String signature = sign(secret, orderId + "|" + paymentId);

        assertThat(verifier.isValid(orderId, paymentId, signature)).isTrue();
    }

    @Test
    void rejectsSignatureForDifferentPaymentData() throws Exception {
        String secret = generatedSecret();
        RazorpaySignatureVerifier verifier = new RazorpaySignatureVerifier(secret);
        String orderId = "order_" + UUID.randomUUID();
        String paymentId = "pay_" + UUID.randomUUID();
        String signature = sign(secret, orderId + "|pay_" + UUID.randomUUID());

        assertThat(verifier.isValid(orderId, paymentId, signature)).isFalse();
    }

    @Test
    void rejectsSignatureWhenSecretIsNotConfigured() throws Exception {
        String secret = generatedSecret();
        RazorpaySignatureVerifier verifier = new RazorpaySignatureVerifier("");
        String orderId = "order_" + UUID.randomUUID();
        String paymentId = "pay_" + UUID.randomUUID();

        assertThat(verifier.isValid(orderId, paymentId, sign(secret, orderId + "|" + paymentId))).isFalse();
    }

    @Test
    void acceptsUppercaseSignature() throws Exception {
        String secret = generatedSecret();
        RazorpaySignatureVerifier verifier = new RazorpaySignatureVerifier(secret);
        String orderId = "order_" + UUID.randomUUID();
        String paymentId = "pay_" + UUID.randomUUID();

        String signature = sign(secret, orderId + "|" + paymentId).toUpperCase();

        assertThat(verifier.isValid(orderId, paymentId, signature)).isTrue();
    }

    private String generatedSecret() {
        return "test-secret-" + UUID.randomUUID();
    }

    private String sign(String secret, String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }
}

package com.lms.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;

@Component
public class RazorpaySignatureVerifier {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final String keySecret;

    public RazorpaySignatureVerifier(@Value("${razorpay.key.secret:}") String keySecret) {
        this.keySecret = keySecret;
    }

    public boolean isValid(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        if (isBlank(razorpayOrderId)
                || isBlank(razorpayPaymentId)
                || isBlank(razorpaySignature)
                || isBlank(keySecret)) {
            return false;
        }

        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            byte[] digest = mac.doFinal(
                    (razorpayOrderId + "|" + razorpayPaymentId).getBytes(StandardCharsets.UTF_8));
            String expected = HexFormat.of().formatHex(digest);
            return MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    razorpaySignature.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8)
            );
        } catch (GeneralSecurityException exception) {
            return false;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

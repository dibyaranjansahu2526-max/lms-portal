package com.lms.service;

import com.lms.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class RazorpayOrderClient {

    private static final Logger log = LoggerFactory.getLogger(RazorpayOrderClient.class);
    private static final String RAZORPAY_API_BASE_URL = "https://api.razorpay.com";

    private final RestClient restClient;
    private final String keyId;
    private final String keySecret;

    public RazorpayOrderClient(@Value("${razorpay.key.id:}") String keyId,
                               @Value("${razorpay.key.secret:}") String keySecret) {
        this.restClient = RestClient.builder().baseUrl(RAZORPAY_API_BASE_URL).build();
        this.keyId = keyId;
        this.keySecret = keySecret;
    }

    public RazorpayOrder createOrder(long amountInPaise, String receipt) {
        requireConfigured();

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("amount", amountInPaise);
        request.put("currency", "INR");
        request.put("receipt", receipt);
        request.put("payment_capture", 1);

        try {
            Map<String, Object> response = restClient.post()
                    .uri("/v1/orders")
                    .headers(headers -> headers.setBasicAuth(keyId, keySecret))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });

            if (response == null || response.get("id") == null) {
                throw ApiException.badRequest("Razorpay did not return an order id. Please try again.");
            }

            long amount = response.get("amount") instanceof Number number
                    ? number.longValue()
                    : amountInPaise;
            String currency = response.get("currency") == null
                    ? "INR"
                    : response.get("currency").toString();

            return new RazorpayOrder(response.get("id").toString(), amount, currency);
        } catch (RestClientException exception) {
            log.warn("Razorpay order creation failed: {}", exception.getMessage());
            throw ApiException.badRequest("Unable to create a Razorpay order. Please try again.");
        }
    }

    public String getKeyId() {
        requireConfigured();
        return keyId;
    }

    private void requireConfigured() {
        if (isBlank(keyId) || isBlank(keySecret)) {
            throw ApiException.badRequest(
                    "Razorpay is not configured. Set the RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public record RazorpayOrder(String id, long amount, String currency) {
    }
}

package com.lms.service;

import com.lms.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RazorpayOrderClientTest {

    @Test
    void returnsKeyIdWhenCredentialsAreValid() {
        RazorpayOrderClient client = new RazorpayOrderClient("rzp_test_valid", "a-test-secret");

        assertThat(client.getKeyId()).isEqualTo("rzp_test_valid");
    }

    @Test
    void rejectsUnresolvedEnvironmentPlaceholderAsNotConfigured() {
        // A missing closing brace leaves the raw placeholder (which contains ':') as the value.
        RazorpayOrderClient client = new RazorpayOrderClient("${" + "RAZORPAY_KEY_ID" + ":rzp_test_x", "a-test-secret");

        assertThatThrownBy(client::getKeyId)
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void rejectsKeyIdContainingColonBeforeCallingBasicAuth() {
        RazorpayOrderClient client = new RazorpayOrderClient("rzp:test", "a-test-secret");

        assertThatThrownBy(() -> client.createOrder(1000L, "receipt_1"))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void rejectsBlankCredentials() {
        RazorpayOrderClient client = new RazorpayOrderClient("", "");

        assertThatThrownBy(client::getKeyId)
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("not configured");
    }
}

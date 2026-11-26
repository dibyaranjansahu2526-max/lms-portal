package com.lms.service;

import com.lms.dto.ForgotPasswordRequest;
import com.lms.dto.MessageResponse;
import com.lms.dto.ResetPasswordRequest;
import com.lms.entity.PasswordResetToken;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.PasswordResetTokenRepository;
import com.lms.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int TOKEN_VALIDITY_MINUTES = 15;
    private static final String GENERIC_MESSAGE =
            "If an account exists for that email, a password reset link has been sent.";
    private static final String INVALID_TOKEN_MESSAGE = "This password reset link is invalid or has expired.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl = "http://localhost:5173";

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public MessageResponse requestPasswordReset(ForgotPasswordRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setToken(generateToken());
            resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(TOKEN_VALIDITY_MINUTES));
            resetToken.setUsed(false);
            tokenRepository.save(resetToken);

            log.info("Password reset link for {}: {}/reset-password?token={}",
                    user.getEmail(), frontendBaseUrl, resetToken.getToken());
        });
        return new MessageResponse(GENERIC_MESSAGE);
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String password = request.password();
        if (password == null || password.length() < 6 || password.length() > 100) {
            throw ApiException.badRequest("Password must be between 6 and 100 characters");
        }

        String tokenValue = request.token() == null ? "" : request.token().trim();
        PasswordResetToken resetToken = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> ApiException.badRequest(INVALID_TOKEN_MESSAGE));

        if (resetToken.isUsed() || !resetToken.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw ApiException.badRequest(INVALID_TOKEN_MESSAGE);
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        return new MessageResponse("Your password has been reset. You can now sign in.");
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
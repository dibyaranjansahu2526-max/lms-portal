package com.lms.service;

import com.lms.dto.ForgotPasswordRequest;
import com.lms.dto.MessageResponse;
import com.lms.dto.ResetPasswordRequest;
import com.lms.entity.PasswordResetToken;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.PasswordResetTokenRepository;
import com.lms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User user;
    private PasswordResetToken resetToken;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setName("Aarav Mehta");
        user.setEmail("student1@lms.com");
        user.setPassword("old-hash");
        user.setRole(Role.STUDENT);

        resetToken = new PasswordResetToken();
        resetToken.setId(10L);
        resetToken.setUser(user);
        resetToken.setToken("valid-token");
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        resetToken.setUsed(false);
    }

    @Test
    void resetsPasswordAndMarksValidTokenUsed() {
        when(tokenRepository.findByToken("valid-token")).thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode("newPassword")).thenReturn("new-hash");

        MessageResponse response = passwordResetService.resetPassword(
                new ResetPasswordRequest("valid-token", "newPassword"));

        assertThat(response.message()).contains("password has been reset");
        assertThat(user.getPassword()).isEqualTo("new-hash");
        assertThat(resetToken.isUsed()).isTrue();
        verify(userRepository).save(user);
        verify(tokenRepository).save(resetToken);
    }

    @Test
    void rejectsExpiredToken() {
        resetToken.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(tokenRepository.findByToken("valid-token")).thenReturn(Optional.of(resetToken));

        assertThatThrownBy(() -> passwordResetService.resetPassword(
                new ResetPasswordRequest("valid-token", "newPassword")))
                .isInstanceOf(ApiException.class)
                .hasMessage("This password reset link is invalid or has expired.");

        assertThat(user.getPassword()).isEqualTo("old-hash");
        assertThat(resetToken.isUsed()).isFalse();
        verify(userRepository, never()).save(any());
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void rejectsUsedToken() {
        resetToken.setUsed(true);
        when(tokenRepository.findByToken("valid-token")).thenReturn(Optional.of(resetToken));

        assertThatThrownBy(() -> passwordResetService.resetPassword(
                new ResetPasswordRequest("valid-token", "newPassword")))
                .isInstanceOf(ApiException.class)
                .hasMessage("This password reset link is invalid or has expired.");

        assertThat(user.getPassword()).isEqualTo("old-hash");
        verify(userRepository, never()).save(any());
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void rejectsUnknownToken() {
        when(tokenRepository.findByToken("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.resetPassword(
                new ResetPasswordRequest("missing", "newPassword")))
                .isInstanceOf(ApiException.class)
                .hasMessage("This password reset link is invalid or has expired.");
    }

    @Test
    void rejectsPasswordShorterThanSixCharacters() {
        assertThatThrownBy(() -> passwordResetService.resetPassword(
                new ResetPasswordRequest("valid-token", "12345")))
                .isInstanceOf(ApiException.class)
                .hasMessage("Password must be between 6 and 100 characters");
    }

    @Test
    void createsFifteenMinuteTokenForKnownEmail() {
        when(userRepository.findByEmailIgnoreCase("student1@lms.com")).thenReturn(Optional.of(user));

        MessageResponse response = passwordResetService.requestPasswordReset(
                new ForgotPasswordRequest("  Student1@LMS.com  "));

        assertThat(response.message()).isEqualTo(
                "If an account exists for that email, a password reset link has been sent.");
        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(captor.capture());
        PasswordResetToken saved = captor.getValue();
        assertThat(saved.getUser()).isSameAs(user);
        assertThat(saved.getToken()).hasSizeGreaterThan(20);
        assertThat(saved.isUsed()).isFalse();
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(14));
    }

    @Test
    void returnsSameMessageAndCreatesNoTokenForUnknownEmail() {
        when(userRepository.findByEmailIgnoreCase("nobody@example.com")).thenReturn(Optional.empty());

        MessageResponse response = passwordResetService.requestPasswordReset(
                new ForgotPasswordRequest("nobody@example.com"));

        assertThat(response.message()).isEqualTo(
                "If an account exists for that email, a password reset link has been sent.");
        verify(tokenRepository, never()).save(any());
    }
}
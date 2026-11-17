package com.lms.service;

import com.lms.dto.ChangePasswordRequest;
import com.lms.dto.UpdateProfileRequest;
import com.lms.dto.UserDto;
import com.lms.entity.Role;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ProfileService profileService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(7L);
        user.setName("Test Student");
        user.setEmail("student@example.com");
        user.setPassword("encoded-old-password");
        user.setRole(Role.STUDENT);
    }

    @Test
    void updatesTheAuthenticatedUsersName() {
        when(currentUserService.get(authentication)).thenReturn(user);
        when(userRepository.save(user)).thenReturn(user);

        UserDto result = profileService.updateName(
                new UpdateProfileRequest("  Grace Hopper  "), authentication);

        assertThat(result.name()).isEqualTo("Grace Hopper");
        assertThat(result.email()).isEqualTo("student@example.com");
        assertThat(user.getName()).isEqualTo("Grace Hopper");
        verify(userRepository).save(user);
    }

    @Test
    void rejectsAnIncorrectCurrentPassword() {
        when(currentUserService.get(authentication)).thenReturn(user);
        when(passwordEncoder.matches("wrong-password", "encoded-old-password")).thenReturn(false);

        assertThatThrownBy(() -> profileService.changePassword(
                new ChangePasswordRequest("wrong-password", "new-password"), authentication))
                .isInstanceOf(ApiException.class)
                .hasMessage("Current password is incorrect")
                .satisfies(error -> assertThat(((ApiException) error).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(passwordEncoder, never()).encode(anyString());
        verifyNoInteractions(userRepository);
    }

    @Test
    void rejectsAnInvalidNewPassword() {
        when(currentUserService.get(authentication)).thenReturn(user);
        when(passwordEncoder.matches("old-password", "encoded-old-password")).thenReturn(true);

        assertThatThrownBy(() -> profileService.changePassword(
                new ChangePasswordRequest("old-password", "short"), authentication))
                .isInstanceOf(ApiException.class)
                .hasMessage("New password must be between 6 and 100 characters")
                .satisfies(error -> assertThat(((ApiException) error).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(passwordEncoder, never()).encode(anyString());
        verifyNoInteractions(userRepository);
    }

    @Test
    void changesTheAuthenticatedUsersPassword() {
        when(currentUserService.get(authentication)).thenReturn(user);
        when(passwordEncoder.matches("old-password", "encoded-old-password")).thenReturn(true);
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-new-password");

        profileService.changePassword(new ChangePasswordRequest("old-password", "new-password"), authentication);

        assertThat(user.getPassword()).isEqualTo("encoded-new-password");
        verify(userRepository).save(user);
    }
}

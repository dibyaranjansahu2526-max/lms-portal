package com.lms.service;

import com.lms.dto.ChangePasswordRequest;
import com.lms.dto.UpdateProfileRequest;
import com.lms.dto.UserDto;
import com.lms.entity.User;
import com.lms.exception.ApiException;
import com.lms.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;

    public ProfileService(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public UserDto get(Authentication authentication) {
        return toDto(currentUserService.get(authentication));
    }

    @Transactional
    public UserDto updateName(UpdateProfileRequest request, Authentication authentication) {
        User user = currentUserService.get(authentication);
        String name = request.name() == null ? "" : request.name().trim();
        if (name.isEmpty()) {
            throw ApiException.badRequest("Name is required");
        }
        if (name.length() > 120) {
            throw ApiException.badRequest("Name must be at most 120 characters");
        }

        user.setName(name);
        return toDto(userRepository.save(user));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request, Authentication authentication) {
        User user = currentUserService.get(authentication);
        String currentPassword = request.currentPassword();
        if (currentPassword == null || currentPassword.isBlank()) {
            throw ApiException.badRequest("Current password is required");
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw ApiException.badRequest("Current password is incorrect");
        }

        String newPassword = request.newPassword();
        if (newPassword == null || newPassword.isBlank() || newPassword.length() < 6 || newPassword.length() > 100) {
            throw ApiException.badRequest("New password must be between 6 and 100 characters");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }
}

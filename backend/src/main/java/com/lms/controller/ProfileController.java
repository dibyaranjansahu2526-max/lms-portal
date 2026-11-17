package com.lms.controller;

import com.lms.dto.ChangePasswordRequest;
import com.lms.dto.UpdateProfileRequest;
import com.lms.dto.UserDto;
import com.lms.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public UserDto get(Authentication authentication) {
        return profileService.get(authentication);
    }

    @PutMapping
    public UserDto updateName(@Valid @RequestBody UpdateProfileRequest request,
                              Authentication authentication) {
        return profileService.updateName(request, authentication);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request,
                               Authentication authentication) {
        profileService.changePassword(request, authentication);
    }
}

package com.lms.dto;

import com.lms.entity.Role;

import java.time.LocalDateTime;

public record UserDto(
        Long id,
        String name,
        String email,
        Role role,
        LocalDateTime createdAt
) {
}

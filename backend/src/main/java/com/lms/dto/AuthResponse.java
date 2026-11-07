package com.lms.dto;

public record AuthResponse(String token, UserDto user) {
}

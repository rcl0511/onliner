package com.onliner.medicine_server.auth;

public record LoginRequest(
        String role,
        String phone,
        String password,
        String companyCode,
        String email
) {
}

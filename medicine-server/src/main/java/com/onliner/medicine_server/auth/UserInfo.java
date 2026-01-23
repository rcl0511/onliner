package com.onliner.medicine_server.auth;

public record UserInfo(
        String role,
        String name,
        String companyCode,
        String companyName,
        String permission,
        String hospitalName,
        String hospitalId,
        String phone,
        String email,
        boolean requiresPasswordChange
) {
    public String identifier() {
        if (phone != null && !phone.isBlank()) return phone;
        if (email != null && !email.isBlank()) return email;
        return "unknown";
    }
}

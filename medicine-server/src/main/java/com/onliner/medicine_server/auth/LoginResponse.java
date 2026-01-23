package com.onliner.medicine_server.auth;

public record LoginResponse(String token, UserInfo user) {
}

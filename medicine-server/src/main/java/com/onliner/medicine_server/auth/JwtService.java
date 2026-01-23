package com.onliner.medicine_server.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMillis;

    public JwtService(
            @Value("${jwt.secret:change-me-please-change-me-please-change-me}") String secret,
            @Value("${jwt.expiration-minutes:480}") long expirationMinutes
    ) {
        byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(raw.length < 32 ? (secret + "0123456789abcdef0123456789abcdef").getBytes(StandardCharsets.UTF_8) : raw);
        this.expirationMillis = expirationMinutes * 60 * 1000;
    }

    public String generateToken(UserInfo user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.role());
        if (user.permission() != null) claims.put("permission", user.permission());
        if (user.companyCode() != null) claims.put("companyCode", user.companyCode());
        if (user.hospitalId() != null) claims.put("hospitalId", user.hospitalId());
        if (user.phone() != null) claims.put("phone", user.phone());
        if (user.email() != null) claims.put("email", user.email());

        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMillis);
        return Jwts.builder()
                .setSubject(user.identifier())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .addClaims(claims)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseToken(String token) throws JwtException {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}

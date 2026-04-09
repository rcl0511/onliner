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
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-minutes:480}") long expirationMinutes
    ) {
        byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
        if (raw.length < 32) {
            throw new IllegalArgumentException("JWT_SECRET must be at least 32 characters");
        }
        this.key = Keys.hmacShaKeyFor(raw);
        this.expirationMillis = expirationMinutes * 60 * 1000;
    }

    public String generateToken(UserInfo user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.role());
        if (user.permission() != null) claims.put("permission", user.permission());
        if (user.companyCode() != null) claims.put("companyCode", user.companyCode());
        if (user.companyName() != null) claims.put("companyName", user.companyName());
        if (user.hospitalId() != null) claims.put("hospitalId", user.hospitalId());
        if (user.hospitalName() != null) claims.put("hospitalName", user.hospitalName());
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

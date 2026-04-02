package com.onliner.medicine_server.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 병원: 전화번호, 업체: 이메일
    @Column(nullable = false, unique = true, length = 100)
    private String identifier;

    @Column(nullable = false)
    private String password;

    // "hospital" or "vendor"
    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "requires_password_change", nullable = false)
    @Builder.Default
    private boolean requiresPasswordChange = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

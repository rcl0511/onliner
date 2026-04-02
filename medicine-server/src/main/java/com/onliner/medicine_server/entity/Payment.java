package com.onliner.medicine_server.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 병원 식별자
    @Column(nullable = false, length = 50)
    private String hospitalId;

    // 업체 코드
    @Column(nullable = false, length = 50)
    private String companyCode;

    // 주문 ID (토스 orderId, 중복 불가)
    @Column(nullable = false, unique = true, length = 100)
    private String orderId;

    // 명세서 참조 ID
    @Column(length = 100)
    private String invoiceRef;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    // PENDING, PAID, FAILED, CANCELLED
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    // 토스 결제 키 (결제 완료 후 수신)
    @Column(length = 200)
    private String paymentKey;

    // 결제 수단 (카드, 가상계좌, 계좌이체 등)
    @Column(length = 50)
    private String method;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}

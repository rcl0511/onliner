package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.service.PaymentService;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.context.annotation.Profile;

import java.util.*;

@Profile("!render-nodb")
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // 병원 결제 내역 조회
    @GetMapping("/hospital")
    public ResponseEntity<Map<String, Object>> getHospitalPayments(Authentication auth) {
        return ResponseEntity.ok(paymentService.getHospitalPayments((Claims) auth.getDetails()));
    }

    // 결제 생성 (토스 결제창 호출 전)
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createPayment(@RequestBody Map<String, Object> body, Authentication auth) {
        return ResponseEntity.ok(paymentService.createPayment(body, (Claims) auth.getDetails()));
    }

    // 토스페이먼츠 결제 승인
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmPayment(@RequestBody Map<String, String> body, Authentication auth) {
        return ResponseEntity.ok(paymentService.confirmPayment(body));
    }
}

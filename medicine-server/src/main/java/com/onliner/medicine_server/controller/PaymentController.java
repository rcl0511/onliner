package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.Payment;
import com.onliner.medicine_server.repository.PaymentRepository;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.context.annotation.Profile;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Base64;

@Profile("!render-nodb")
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;

    @Value("${toss.secret-key:}")
    private String tossSecretKey;

    public PaymentController(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    // 병원 결제 내역 조회
    @GetMapping("/hospital")
    public ResponseEntity<Map<String, Object>> getHospitalPayments(Authentication auth) {
        Claims claims = (Claims) auth.getDetails();
        String hospitalId = claims.get("hospitalId", String.class);

        if (hospitalId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "병원 계정만 접근 가능합니다.");
        }

        List<Payment> payments = paymentRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId);

        BigDecimal totalPaid = paymentRepository.sumPaidByHospitalId(hospitalId);
        BigDecimal totalPending = paymentRepository.sumPendingByHospitalId(hospitalId);

        List<Map<String, Object>> paymentList = payments.stream().map(p -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", p.getOrderId());
            item.put("invoiceRef", p.getInvoiceRef());
            item.put("amount", p.getAmount());
            item.put("status", mapStatus(p.getStatus()));
            item.put("method", p.getMethod());
            item.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
            item.put("approvedAt", p.getApprovedAt() != null ? p.getApprovedAt().toString() : null);
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalUnpaid", totalPending);
        summary.put("paidAmount", totalPaid);
        summary.put("monthlyExpected", totalPending);
        summary.put("overdueAmount", BigDecimal.ZERO);

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("payments", paymentList);

        return ResponseEntity.ok(result);
    }

    // 결제 생성 (토스 결제창 호출 전)
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createPayment(@RequestBody Map<String, Object> body, Authentication auth) {
        Claims claims = (Claims) auth.getDetails();
        String hospitalId = claims.get("hospitalId", String.class);

        if (hospitalId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "병원 계정만 접근 가능합니다.");
        }

        String invoiceRef = (String) body.get("invoiceRef");
        Object amountObj = body.get("amount");
        if (amountObj == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount가 필요합니다.");
        }
        BigDecimal amount;
        try {
            amount = amountObj instanceof Number
                    ? BigDecimal.valueOf(((Number) amountObj).doubleValue())
                    : new BigDecimal(amountObj.toString());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount 형식이 올바르지 않습니다.");
        }

        String orderId = "ORDER-" + hospitalId + "-" + System.currentTimeMillis();

        Payment payment = Payment.builder()
                .hospitalId(hospitalId)
                .companyCode("")
                .orderId(orderId)
                .invoiceRef(invoiceRef)
                .amount(amount)
                .status("PENDING")
                .build();
        paymentRepository.save(payment);

        return ResponseEntity.ok(Map.of("orderId", orderId, "amount", amount));
    }

    // 토스페이먼츠 결제 승인
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmPayment(@RequestBody Map<String, String> body, Authentication auth) {
        String paymentKey = body.get("paymentKey");
        String orderId = body.get("orderId");
        String amountStr = body.get("amount");

        if (paymentKey == null || orderId == null || amountStr == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paymentKey, orderId, amount 필수입니다.");
        }

        if (tossSecretKey == null || tossSecretKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "결제 설정이 완료되지 않았습니다.");
        }

        // 토스페이먼츠 결제 승인 API 호출
        try {
            String credentials = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes(StandardCharsets.UTF_8));
            Map<String, Object> tossBody = new LinkedHashMap<>();
            tossBody.put("paymentKey", paymentKey);
            tossBody.put("orderId", orderId);
            BigDecimal parsedAmount;
            try {
                parsedAmount = new BigDecimal(amountStr);
            } catch (NumberFormatException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount 형식이 올바르지 않습니다: " + amountStr);
            }
            tossBody.put("amount", parsedAmount);
            String requestBody = new ObjectMapper().writeValueAsString(tossBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.tosspayments.com/v1/payments/confirm"))
                    .header("Authorization", "Basic " + credentials)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 승인 실패: " + response.body());
            }

            // DB 업데이트
            paymentRepository.findByOrderId(orderId).ifPresent(payment -> {
                payment.setStatus("PAID");
                payment.setPaymentKey(paymentKey);
                payment.setApprovedAt(LocalDateTime.now());
                paymentRepository.save(payment);
            });

            return ResponseEntity.ok(Map.of("status", "PAID", "orderId", orderId));

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "결제 처리 중 오류: " + e.getMessage());
        }
    }

    private String mapStatus(String status) {
        return switch (status) {
            case "PAID" -> "paid";
            case "FAILED" -> "failed";
            case "CANCELLED" -> "cancelled";
            default -> "unpaid";
        };
    }
}

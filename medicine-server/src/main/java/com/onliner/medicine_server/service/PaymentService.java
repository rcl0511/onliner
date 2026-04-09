package com.onliner.medicine_server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onliner.medicine_server.entity.Payment;
import com.onliner.medicine_server.repository.PaymentRepository;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Profile("!render-nodb")
public class PaymentService {

    private final PaymentRepository paymentRepository;

    @Value("${toss.secret-key:}")
    private String tossSecretKey;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Map<String, Object> getHospitalPayments(Claims claims) {
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

        return Map.of(
                "summary", Map.of(
                        "totalUnpaid", totalPending,
                        "paidAmount", totalPaid,
                        "monthlyExpected", totalPending,
                        "overdueAmount", BigDecimal.ZERO
                ),
                "payments", paymentList
        );
    }

    public Map<String, Object> createPayment(Map<String, Object> body, Claims claims) {
        String hospitalId = claims.get("hospitalId", String.class);
        if (hospitalId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "병원 계정만 접근 가능합니다.");
        }
        Object amountObj = body.get("amount");
        if (amountObj == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount가 필요합니다.");
        }
        BigDecimal amount = parseAmount(amountObj.toString());
        String invoiceRef = (String) body.get("invoiceRef");
        String orderId = "ORDER-" + hospitalId + "-" + System.currentTimeMillis();

        Payment payment = Payment.builder()
                .hospitalId(hospitalId)
                .companyCode("")
                .orderId(orderId)
                .invoiceRef(invoiceRef)
                .amount(amount)
                .status("PENDING")
                .build();
        paymentRepository.save(Objects.requireNonNull(payment));
        return Map.of("orderId", orderId, "amount", amount);
    }

    public Map<String, Object> confirmPayment(Map<String, String> body) {
        String paymentKey = body.get("paymentKey");
        String orderId = body.get("orderId");
        String amountStr = body.get("amount");

        if (paymentKey == null || orderId == null || amountStr == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paymentKey, orderId, amount 필수입니다.");
        }
        if (tossSecretKey == null || tossSecretKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "결제 설정이 완료되지 않았습니다.");
        }

        try {
            String credentials = Base64.getEncoder()
                    .encodeToString((tossSecretKey + ":").getBytes(StandardCharsets.UTF_8));
            Map<String, Object> tossBody = new LinkedHashMap<>();
            tossBody.put("paymentKey", paymentKey);
            tossBody.put("orderId", orderId);
            tossBody.put("amount", parseAmount(amountStr));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.tosspayments.com/v1/payments/confirm"))
                    .header("Authorization", "Basic " + credentials)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(new ObjectMapper().writeValueAsString(tossBody)))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 승인 실패: " + response.body());
            }

            paymentRepository.findByOrderId(orderId).ifPresent(payment -> {
                payment.setStatus("PAID");
                payment.setPaymentKey(paymentKey);
                payment.setApprovedAt(LocalDateTime.now());
                paymentRepository.save(Objects.requireNonNull(payment));
            });

            return Map.of("status", "PAID", "orderId", orderId);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "결제 처리 중 오류: " + e.getMessage());
        }
    }

    private BigDecimal parseAmount(String amount) {
        try {
            return new BigDecimal(amount);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount 형식이 올바르지 않습니다.");
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

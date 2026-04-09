package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.InvoiceRecord;
import com.onliner.medicine_server.service.InvoiceRecordService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 명세서 발행/조회/상태변경 API
 * - VENDOR: 명세서 발행, 발행 목록 조회
 * - HOSPITAL: 수신 목록 조회, 확인/이의신청
 */
@RestController
@RequestMapping("/api/invoice-records")
@RequiredArgsConstructor
@Profile("!render-nodb")
public class InvoiceManagementController {

    private final InvoiceRecordService invoiceRecordService;

    // ──────────────────────────────────────────────
    // [VENDOR] POST /api/invoice-records
    // 명세서 발행 (병원에 전송)
    // ──────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createInvoice(
            @RequestBody Map<String, Object> body,
            Authentication auth
    ) {
        return ResponseEntity.ok(invoiceRecordService.createInvoice(body, extractClaims(auth)));
    }

    // ──────────────────────────────────────────────
    // [VENDOR] GET /api/invoice-records/vendor
    // 내가 발행한 명세서 목록
    // ──────────────────────────────────────────────
    @GetMapping("/vendor")
    public ResponseEntity<List<InvoiceRecord>> getVendorInvoices(
            @RequestParam(required = false) String status,
            Authentication auth
    ) {
        return ResponseEntity.ok(invoiceRecordService.getVendorInvoices(status, extractClaims(auth)));
    }

    // ──────────────────────────────────────────────
    // [HOSPITAL] GET /api/invoice-records/hospital
    // 나에게 온 명세서 목록
    // ──────────────────────────────────────────────
    @GetMapping("/hospital")
    public ResponseEntity<List<InvoiceRecord>> getHospitalInvoices(Authentication auth) {
        return ResponseEntity.ok(invoiceRecordService.getHospitalInvoices(extractClaims(auth)));
    }

    // ──────────────────────────────────────────────
    // [BOTH] GET /api/invoice-records/{id}
    // 명세서 상세 조회
    // ──────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoice(@PathVariable String id, Authentication auth) {
        return ResponseEntity.ok(invoiceRecordService.getInvoice(id, extractClaims(auth)));
    }

    // ──────────────────────────────────────────────
    // [HOSPITAL] PUT /api/invoice-records/{id}/status
    // 명세서 확인 또는 이의신청
    // ──────────────────────────────────────────────
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        return ResponseEntity.ok(invoiceRecordService.updateStatus(id, body, extractClaims(auth)));
    }

    @Nullable
    private Claims extractClaims(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            return claims;
        }
        return null;
    }
}

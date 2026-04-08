package com.onliner.medicine_server.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * render-nodb 프로파일 전용 Mock 명세서 컨트롤러
 */
@RestController
@RequestMapping("/api/invoice-records")
@Profile("render-nodb")
public class MockInvoiceManagementController {

    @PostMapping
    public ResponseEntity<?> createInvoice(@RequestBody Map<String, Object> body) {
        String id = "INV-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        return ResponseEntity.ok(Map.of(
                "message", "명세서가 발행되었습니다. (Mock)",
                "invoiceId", id,
                "invoiceNumber", "INV-" + Instant.now().toEpochMilli()
        ));
    }

    @GetMapping("/vendor")
    public ResponseEntity<List<Map<String, Object>>> getVendorInvoices() {
        return ResponseEntity.ok(List.of(
                Map.of("id", "INV-MOCK001", "invoiceNumber", "INV-20240615-001",
                       "vendorCode", "dh-pharm", "hospitalName", "테스트병원A",
                       "totalAmount", 1250000, "status", "SENT",
                       "invoiceType", "MANUAL", "createdAt", Instant.now().toString()),
                Map.of("id", "INV-MOCK002", "invoiceNumber", "INV-20240614-001",
                       "vendorCode", "dh-pharm", "hospitalName", "테스트병원B",
                       "totalAmount", 980000, "status", "CONFIRMED",
                       "invoiceType", "PDF", "createdAt", Instant.now().minusSeconds(86400).toString())
        ));
    }

    @GetMapping("/hospital")
    public ResponseEntity<List<Map<String, Object>>> getHospitalInvoices() {
        return ResponseEntity.ok(List.of(
                Map.of("id", "INV-MOCK001", "invoiceNumber", "INV-20240615-001",
                       "vendorName", "DH약품", "totalAmount", 1250000,
                       "status", "SENT", "invoiceType", "MANUAL",
                       "createdAt", Instant.now().toString())
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoice(@PathVariable String id) {
        return ResponseEntity.ok(Map.of(
                "id", id, "invoiceNumber", "INV-20240615-001",
                "vendorName", "DH약품", "hospitalName", "테스트병원A",
                "totalAmount", 1250000, "status", "SENT",
                "items", "[]", "createdAt", Instant.now().toString()
        ));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("message", "상태가 변경되었습니다. (Mock)", "status", body.getOrDefault("status", "CONFIRMED")));
    }
}

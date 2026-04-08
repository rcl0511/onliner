package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.InvoiceRecord;
import com.onliner.medicine_server.repository.InvoiceRecordRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

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

    private final InvoiceRecordRepository invoiceRecordRepository;

    // ──────────────────────────────────────────────
    // [VENDOR] POST /api/invoice-records
    // 명세서 발행 (병원에 전송)
    // ──────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createInvoice(
            @RequestBody Map<String, Object> body,
            Authentication auth
    ) {
        Claims claims = extractClaims(auth);
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String vendorCode = claims.get("companyCode", String.class);
        String vendorName = claims.get("companyName", String.class);

        String hospitalId = (String) body.get("hospitalId");
        String hospitalName = (String) body.getOrDefault("hospitalName", "");
        String items = body.containsKey("items") ? body.get("items").toString() : "[]";
        String pdfUrl = (String) body.get("pdfUrl");
        String invoiceType = pdfUrl != null && !pdfUrl.isBlank() ? "PDF" : "MANUAL";

        Object totalRaw = body.get("totalAmount");
        long totalAmount = totalRaw instanceof Number n ? n.longValue() : 0L;

        if (hospitalId == null || hospitalId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "hospitalId가 필요합니다."));
        }
        if (vendorCode == null || vendorCode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "업체 코드를 확인할 수 없습니다."));
        }

        String id = "INV-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        String invoiceNumber = generateInvoiceNumber();

        InvoiceRecord record = InvoiceRecord.builder()
                .id(id)
                .invoiceNumber(invoiceNumber)
                .vendorCode(vendorCode)
                .vendorName(vendorName != null ? vendorName : "")
                .hospitalId(hospitalId)
                .hospitalName(hospitalName)
                .pdfUrl(pdfUrl)
                .items(items)
                .totalAmount(totalAmount)
                .status("SENT")
                .invoiceType(invoiceType)
                .createdAt(Instant.now())
                .build();

        invoiceRecordRepository.save(Objects.requireNonNull(record));

        return ResponseEntity.ok(Map.of(
                "message", "명세서가 발행되었습니다.",
                "invoiceId", id,
                "invoiceNumber", invoiceNumber
        ));
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
        Claims claims = extractClaims(auth);
        if (claims == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String vendorCode = claims.get("companyCode", String.class);
        if (vendorCode == null) return ResponseEntity.ok(List.of());

        List<InvoiceRecord> list = (status != null && !status.isBlank())
                ? invoiceRecordRepository.findByVendorCodeAndStatus(vendorCode, status.toUpperCase()) // vendorCode non-null checked above
                : invoiceRecordRepository.findByVendorCodeOrderByCreatedAtDesc(vendorCode);

        return ResponseEntity.ok(list);
    }

    // ──────────────────────────────────────────────
    // [HOSPITAL] GET /api/invoice-records/hospital
    // 나에게 온 명세서 목록
    // ──────────────────────────────────────────────
    @GetMapping("/hospital")
    public ResponseEntity<List<InvoiceRecord>> getHospitalInvoices(Authentication auth) {
        Claims claims = extractClaims(auth);
        if (claims == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String hospitalId = claims.get("hospitalId", String.class);
        if (hospitalId == null) return ResponseEntity.ok(List.of());

        List<InvoiceRecord> list = invoiceRecordRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId);
        return ResponseEntity.ok(list);
    }

    // ──────────────────────────────────────────────
    // [BOTH] GET /api/invoice-records/{id}
    // 명세서 상세 조회
    // ──────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoice(@PathVariable String id, Authentication auth) {
        Claims claims = extractClaims(auth);
        if (claims == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<InvoiceRecord> opt = invoiceRecordRepository.findById(Objects.requireNonNull(id));
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        InvoiceRecord record = opt.get();

        // 접근 권한: 발행한 업체 또는 수신 병원만 조회 가능
        String vendorCode = claims.get("companyCode", String.class);
        String hospitalId = claims.get("hospitalId", String.class);
        String recVendorCode = record.getVendorCode() != null ? record.getVendorCode() : "";
        String recHospitalId = record.getHospitalId() != null ? record.getHospitalId() : "";
        boolean isVendor = vendorCode != null && vendorCode.equals(recVendorCode);
        boolean isHospital = hospitalId != null && hospitalId.equals(recHospitalId);

        if (!isVendor && !isHospital) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(record);
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
        Claims claims = extractClaims(auth);
        if (claims == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String hospitalId = claims.get("hospitalId", String.class);
        String newStatus = body.get("status");
        String note = body.get("note");
        String disputeType = body.get("disputeType");
        String disputeMemo = body.get("disputeMemo");

        if (newStatus == null || (!newStatus.equals("CONFIRMED") && !newStatus.equals("DISPUTED"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "status는 CONFIRMED 또는 DISPUTED여야 합니다."));
        }

        Optional<InvoiceRecord> opt = invoiceRecordRepository.findById(Objects.requireNonNull(id));
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        InvoiceRecord record = opt.get();

        // 수신 병원 본인만 상태 변경 가능
        String recHospId = record.getHospitalId() != null ? record.getHospitalId() : "";
        if (hospitalId == null || !hospitalId.equals(recHospId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if ("CONFIRMED".equals(record.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "이미 확인 완료된 명세서입니다."));
        }

        record.setStatus(newStatus);
        record.setNote(note);
        record.setProcessedByHospitalId(hospitalId);
        record.setStatusChangedAt(Instant.now());
        if ("CONFIRMED".equals(newStatus)) {
            record.setConfirmedAt(Instant.now());
            record.setDisputedAt(null);
            record.setDisputeType(null);
            record.setDisputeMemo(null);
        } else if ("DISPUTED".equals(newStatus)) {
            if (disputeType == null || disputeType.isBlank() || disputeMemo == null || disputeMemo.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "이의 신청 시 disputeType과 disputeMemo가 필요합니다."));
            }
            record.setDisputedAt(Instant.now());
            record.setDisputeType(disputeType);
            record.setDisputeMemo(disputeMemo);
        }
        invoiceRecordRepository.save(Objects.requireNonNull(record));

        return ResponseEntity.ok(Map.of(
                "message", "상태가 변경되었습니다.",
                "status", newStatus,
                "processedByHospitalId", hospitalId,
                "statusChangedAt", record.getStatusChangedAt() != null ? record.getStatusChangedAt().toString() : ""
        ));
    }

    @Nullable
    private Claims extractClaims(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            return claims;
        }
        return null;
    }

    private String generateInvoiceNumber() {
        String date = java.time.LocalDate.now().toString().replace("-", "");
        String suffix = String.valueOf(System.currentTimeMillis()).substring(8);
        return "INV-" + date + "-" + suffix;
    }
}

package com.onliner.medicine_server.service;

import com.onliner.medicine_server.entity.InvoiceRecord;
import com.onliner.medicine_server.repository.InvoiceRecordRepository;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class InvoiceRecordService {

    private final InvoiceRecordRepository invoiceRecordRepository;

    public InvoiceRecordService(InvoiceRecordRepository invoiceRecordRepository) {
        this.invoiceRecordRepository = invoiceRecordRepository;
    }

    public Map<String, Object> createInvoice(Map<String, Object> body, Claims claims) {
        if (claims == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
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
        Integer version = body.get("version") instanceof Number n ? n.intValue() : 1;
        String parentInvoiceId = (String) body.get("parentInvoiceId");
        String revisionNote = (String) body.get("revisionNote");

        if (hospitalId == null || hospitalId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "hospitalId가 필요합니다.");
        }
        if (vendorCode == null || vendorCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업체 코드를 확인할 수 없습니다.");
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
                .version(version != null && version > 0 ? version : 1)
                .parentInvoiceId(parentInvoiceId)
                .revisionNote(revisionNote)
                .build();

        invoiceRecordRepository.save(Objects.requireNonNull(record));
        return Map.of(
                "message", "명세서가 발행되었습니다.",
                "invoiceId", id,
                "invoiceNumber", invoiceNumber
        );
    }

    public List<InvoiceRecord> getVendorInvoices(String status, Claims claims) {
        if (claims == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String vendorCode = claims.get("companyCode", String.class);
        if (vendorCode == null) {
            return List.of();
        }
        return (status != null && !status.isBlank())
                ? invoiceRecordRepository.findByVendorCodeAndStatus(vendorCode, status.toUpperCase())
                : invoiceRecordRepository.findByVendorCodeOrderByCreatedAtDesc(vendorCode);
    }

    public List<InvoiceRecord> getHospitalInvoices(Claims claims) {
        if (claims == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String hospitalId = claims.get("hospitalId", String.class);
        if (hospitalId == null) {
            return List.of();
        }
        return invoiceRecordRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId);
    }

    public InvoiceRecord getInvoice(String id, Claims claims) {
        if (claims == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        InvoiceRecord record = invoiceRecordRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        String vendorCode = claims.get("companyCode", String.class);
        String hospitalId = claims.get("hospitalId", String.class);
        boolean isVendor = vendorCode != null && vendorCode.equals(record.getVendorCode());
        boolean isHospital = hospitalId != null && hospitalId.equals(record.getHospitalId());
        if (!isVendor && !isHospital) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        return record;
    }

    public Map<String, Object> updateStatus(String id, Map<String, String> body, Claims claims) {
        if (claims == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        String hospitalId = claims.get("hospitalId", String.class);
        String newStatus = body.get("status");
        String note = body.get("note");
        String disputeType = body.get("disputeType");
        String disputeMemo = body.get("disputeMemo");

        if (newStatus == null || (!newStatus.equals("CONFIRMED") && !newStatus.equals("DISPUTED"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status는 CONFIRMED 또는 DISPUTED여야 합니다.");
        }

        InvoiceRecord record = invoiceRecordRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (hospitalId == null || !hospitalId.equals(record.getHospitalId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if ("CONFIRMED".equals(record.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 확인 완료된 명세서입니다.");
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
        } else {
            if (disputeType == null || disputeType.isBlank() || disputeMemo == null || disputeMemo.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이의 신청 시 disputeType과 disputeMemo가 필요합니다.");
            }
            record.setDisputedAt(Instant.now());
            record.setDisputeType(disputeType);
            record.setDisputeMemo(disputeMemo);
        }
        invoiceRecordRepository.save(Objects.requireNonNull(record));

        return Map.of(
                "message", "상태가 변경되었습니다.",
                "status", newStatus,
                "processedByHospitalId", hospitalId,
                "statusChangedAt", Objects.requireNonNull(record.getStatusChangedAt()).toString()
        );
    }

    private String generateInvoiceNumber() {
        String date = java.time.LocalDate.now().toString().replace("-", "");
        String suffix = String.valueOf(System.currentTimeMillis()).substring(8);
        return "INV-" + date + "-" + suffix;
    }
}

package com.onliner.medicine_server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * 발행된 명세서를 DB에 영속화하는 엔티티.
 * 도매업체(VENDOR)가 발행 → 병원(HOSPITAL)이 확인/이의신청하는 전체 라이프사이클 추적.
 */
@Entity
@Table(name = "invoice_records",
    indexes = {
        @Index(name = "idx_invoice_vendor_code", columnList = "vendor_code"),
        @Index(name = "idx_invoice_hospital_id", columnList = "hospital_id"),
        @Index(name = "idx_invoice_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceRecord {

    @Id
    @Column(name = "id", length = 100)
    private String id; // INV-{UUID}

    @Column(name = "invoice_number", length = 50)
    private String invoiceNumber; // 표시용 번호 INV-20240615-001

    @Column(name = "vendor_code", length = 50, nullable = false)
    private String vendorCode;

    @Column(name = "vendor_name", length = 100)
    private String vendorName;

    @Column(name = "hospital_id", length = 100, nullable = false)
    private String hospitalId;

    @Column(name = "hospital_name", length = 200)
    private String hospitalName;

    @Column(name = "pdf_url", length = 1000)
    private String pdfUrl; // Supabase URL (PDF 업로드 방식일 때)

    @Column(name = "items", columnDefinition = "TEXT")
    private String items; // JSON array of line items

    @Column(name = "total_amount")
    private Long totalAmount;

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "SENT"; // SENT, CONFIRMED, DISPUTED

    @Column(name = "invoice_type", length = 20)
    @Builder.Default
    private String invoiceType = "MANUAL"; // MANUAL, PDF

    @Column(name = "note", columnDefinition = "TEXT")
    private String note; // 이의신청 사유 등

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "disputed_at")
    private Instant disputedAt;

    @Column(name = "status_changed_at")
    private Instant statusChangedAt;

    @Column(name = "processed_by_hospital_id", length = 100)
    private String processedByHospitalId;

    @Column(name = "dispute_type", length = 50)
    private String disputeType;

    @Column(name = "dispute_memo", columnDefinition = "TEXT")
    private String disputeMemo;
}

package com.onliner.medicine_server.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pdf_assignments")
public class PdfAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seq;           // 자동 생성되는 PK

    private String driverId;    // Driver.id 기준 (문자열)
    private String pdfKey;      // ex: "auto-1627645123456-0"

    public PdfAssignment() {}

    public PdfAssignment(String driverId, String pdfKey) {
        this.driverId = driverId;
        this.pdfKey = pdfKey;
    }

    public Long getSeq() {
        return seq;
    }
    public void setSeq(Long seq) {
        this.seq = seq;
    }

    public String getDriverId() {
        return driverId;
    }
    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public String getPdfKey() {
        return pdfKey;
    }
    public void setPdfKey(String pdfKey) {
        this.pdfKey = pdfKey;
    }
}

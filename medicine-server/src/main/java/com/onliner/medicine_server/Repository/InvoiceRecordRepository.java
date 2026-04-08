package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.InvoiceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InvoiceRecordRepository extends JpaRepository<InvoiceRecord, String> {

    // 도매업체 → 자신이 발행한 명세서 목록 (최신순)
    List<InvoiceRecord> findByVendorCodeOrderByCreatedAtDesc(String vendorCode);

    // 병원 → 자신에게 온 명세서 목록 (최신순)
    List<InvoiceRecord> findByHospitalIdOrderByCreatedAtDesc(String hospitalId);

    // 도매업체 + 병원 조합으로 조회 (병원별 거래 내역)
    List<InvoiceRecord> findByVendorCodeAndHospitalIdOrderByCreatedAtDesc(String vendorCode, String hospitalId);

    // 상태별 조회
    @Query("SELECT i FROM InvoiceRecord i WHERE i.vendorCode = :vendorCode AND i.status = :status ORDER BY i.createdAt DESC")
    List<InvoiceRecord> findByVendorCodeAndStatus(@Param("vendorCode") String vendorCode, @Param("status") String status);
}

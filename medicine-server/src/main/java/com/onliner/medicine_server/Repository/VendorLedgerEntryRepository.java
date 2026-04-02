// src/main/java/com/onliner/medicine_server/repository/VendorLedgerEntryRepository.java
package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.VendorLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface VendorLedgerEntryRepository
        extends JpaRepository<VendorLedgerEntry, Long> {

    // 엔티티 필드명이 `date` 이므로 AndDateBetween 으로 메서드명 작성
    List<VendorLedgerEntry> findAllByHospitalIdAndDateBetween(
            String hospitalId,
            LocalDate from,
            LocalDate to
    );

    // 병원별 미결제 합계
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM VendorLedgerEntry e WHERE e.hospitalId = :hospitalId AND e.date BETWEEN :from AND :to")
    BigDecimal sumAmountByHospitalIdAndDateBetween(
            @Param("hospitalId") String hospitalId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    // 오늘 전체 매출 합계
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM VendorLedgerEntry e WHERE e.date = :date")
    BigDecimal sumTodaySales(@Param("date") LocalDate date);

    // 어제 전체 매출 합계
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM VendorLedgerEntry e WHERE e.date = :date")
    BigDecimal sumDaySales(@Param("date") LocalDate date);

    // 병원별 최근 거래 목록
    List<VendorLedgerEntry> findTop5ByHospitalIdOrderByDateDesc(String hospitalId);
}

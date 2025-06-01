// src/main/java/com/onliner/medicine_server/repository/VendorLedgerEntryRepository.java
package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.VendorLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
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
}

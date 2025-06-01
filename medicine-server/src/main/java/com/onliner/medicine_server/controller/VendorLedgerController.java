// src/main/java/com/onliner/medicine_server/controller/VendorLedgerController.java
package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.VendorLedgerEntry;
import com.onliner.medicine_server.service.VendorLedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorLedgerController {

    private final VendorLedgerService ledgerService;

    // 1) 거래내역 조회
    @GetMapping("/ledger")
    public ResponseEntity<List<VendorLedgerEntry>> getLedger(
            @RequestParam("hospitalId") String hospitalId,
            @RequestParam("from") String fromDate,
            @RequestParam("to") String toDate
    ) {
        List<VendorLedgerEntry> entries =
                ledgerService.getLedgerEntries(hospitalId, fromDate, toDate);
        return ResponseEntity.ok(entries);
    }

    // 2) 엑셀 업로드 (POST, multipart/form-data)
    @PostMapping("/upload-ledger")
    public ResponseEntity<?> uploadLedger(
            @RequestParam("file") MultipartFile file,
            @RequestParam("hospitalId") String hospitalId,
            @RequestParam("from") String fromDate,
            @RequestParam("to") String toDate
    ) {
        try {
            ledgerService.uploadAndSaveExcel(file, hospitalId, fromDate, toDate);
            return ResponseEntity.ok().body("거래장 엑셀 업로드 및 저장 완료");
        } catch (Exception ex) {
            return ResponseEntity
                    .internalServerError()
                    .body("엑셀 업로드 오류: " + ex.getMessage());
        }
    }
}

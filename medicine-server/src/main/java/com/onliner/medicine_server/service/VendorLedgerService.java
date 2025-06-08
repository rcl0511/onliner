// src/main/java/com/onliner/medicine_server/service/VendorLedgerService.java
package com.onliner.medicine_server.service;

import com.onliner.medicine_server.entity.VendorLedgerEntry;
import com.onliner.medicine_server.repository.VendorLedgerEntryRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorLedgerService {

    private final VendorLedgerEntryRepository ledgerRepo;

    // “yyyy-MM-dd” 와 “yyyy/MM/dd” 둘 다 파싱하려고 포맷 두 개 준비
    private final DateTimeFormatter FORMAT_HYPHEN = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private final DateTimeFormatter FORMAT_SLASH  = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    /**
     * 1) 거래내역 조회
     */
    public List<VendorLedgerEntry> getLedgerEntries(
            String hospitalId,
            String fromDateStr,
            String toDateStr
    ) {
        LocalDate from = LocalDate.parse(fromDateStr, FORMAT_HYPHEN);
        LocalDate to   = LocalDate.parse(toDateStr,   FORMAT_HYPHEN);
        return ledgerRepo.findAllByHospitalIdAndDateBetween(hospitalId, from, to);
    }

    /**
     * 2) 엑셀 업로드 → 파싱 → DB 저장
     */
    
@Transactional
public void uploadAndSaveExcel(
        MultipartFile file,
        String hospitalId,
        String fromDate,
        String toDate
) throws Exception {
    // ✅ 파일명 안전하게 받아오기 (null 체크 포함)
    String filename = file.getOriginalFilename();
    if (filename == null) {
        throw new IllegalArgumentException("파일 이름이 null입니다.");
    }

    try (
            InputStream is = file.getInputStream();
            Workbook workbook = filename.endsWith(".xls")
                    ? WorkbookFactory.create(is)      // .xls
                    : new XSSFWorkbook(is)            // .xlsx
    ) {
        Sheet sheet = workbook.getSheetAt(0);
        if (sheet == null) {
            throw new IllegalStateException("업로드된 엑셀 파일에 시트가 없습니다.");
        }

        List<VendorLedgerEntry> entries = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        int rowCount = sheet.getPhysicalNumberOfRows();

        for (int i = 1; i < rowCount; i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            Cell dateCell = row.getCell(1);
            if (dateCell == null) continue;

            LocalDate localDate;
            if (dateCell.getCellType() == CellType.NUMERIC) {
                if (DateUtil.isCellDateFormatted(dateCell)) {
                    localDate = dateCell.getLocalDateTimeCellValue().toLocalDate();
                } else {
                    java.util.Date javaDate = DateUtil.getJavaDate(dateCell.getNumericCellValue());
                    localDate = javaDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                }
            } else {
                String dateString = formatter.formatCellValue(dateCell).trim();
                if (dateString.isEmpty() || dateString.equalsIgnoreCase("소계") || dateString.equalsIgnoreCase("이월잔액")) {
                    continue;
                }
                localDate = dateString.contains("/")
                        ? LocalDate.parse(dateString, FORMAT_SLASH)
                        : LocalDate.parse(dateString, FORMAT_HYPHEN);
            }

            Cell orderIdCell = row.getCell(2);
            String orderId = (orderIdCell != null) ? formatter.formatCellValue(orderIdCell).trim() : "";

            Cell qtyCell = row.getCell(5);
            int qty = 0;
            if (qtyCell != null) {
                if (qtyCell.getCellType() == CellType.NUMERIC) {
                    qty = (int) qtyCell.getNumericCellValue();
                } else {
                    String tmp = formatter.formatCellValue(qtyCell).trim();
                    if (!tmp.isEmpty()) {
                        try {
                            qty = Integer.parseInt(tmp);
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            Cell unitPriceCell = row.getCell(7);
            BigDecimal unitPrice = BigDecimal.ZERO;
            if (unitPriceCell != null) {
                if (unitPriceCell.getCellType() == CellType.NUMERIC) {
                    unitPrice = BigDecimal.valueOf(unitPriceCell.getNumericCellValue());
                } else {
                    String tmp = formatter.formatCellValue(unitPriceCell).trim().replaceAll(",", "");
                    if (!tmp.isEmpty()) {
                        try {
                            unitPrice = new BigDecimal(tmp);
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            Cell amountCell = row.getCell(8);
            BigDecimal amount = BigDecimal.ZERO;
            if (amountCell != null) {
                if (amountCell.getCellType() == CellType.NUMERIC) {
                    amount = BigDecimal.valueOf(amountCell.getNumericCellValue());
                } else {
                    String tmp = formatter.formatCellValue(amountCell).trim().replaceAll(",", "");
                    if (!tmp.isEmpty()) {
                        try {
                            amount = new BigDecimal(tmp);
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            Cell remarksCell = row.getCell(13);
            String remarks = (remarksCell != null) ? formatter.formatCellValue(remarksCell).trim() : "";

            VendorLedgerEntry entry = VendorLedgerEntry.builder()
                    .hospitalId(hospitalId)
                    .date(localDate)
                    .orderId(orderId)
                    .qty(qty)
                    .unitPrice(unitPrice)
                    .amount(amount)
                    .remarks(remarks)
                    .build();
            entries.add(entry);
        }

        ledgerRepo.saveAll(entries);
    }
}

}

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
        try (
                InputStream is = file.getInputStream();
                Workbook workbook = file.getOriginalFilename().endsWith(".xls")
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

                Cell dateCell = row.getCell(1);  // “매출일” 컬럼이 두 번째 열(인덱스 1)인 경우
                // 실제 위치는 엑셀 구조에 맞춰서 인덱스를 바꿔 주세요.
                if (dateCell == null) {
                    // 날짜 셀이 아예 없으면 건너뛰기
                    continue;
                }

                // ───────────────────────────────────────────────────────────
                // ① 날짜 파싱: 숫자형 Date or 숫자 직렬번호 or “yyyy/MM/dd” or “yyyy-MM-dd” or “소계”/“이월잔액” 건너뛰기
                // ───────────────────────────────────────────────────────────
                LocalDate localDate;

                if (dateCell.getCellType() == CellType.NUMERIC) {
                    if (DateUtil.isCellDateFormatted(dateCell)) {
                        // 실제 엑셀 Date 포맷으로 지정된 경우
                        localDate = dateCell.getLocalDateTimeCellValue().toLocalDate();
                    } else {
                        // 숫자(직렬번호)만 들어 있는 경우 → DateUtil.getJavaDate 후 LocalDate 변환
                        java.util.Date javaDate = DateUtil.getJavaDate(dateCell.getNumericCellValue());
                        localDate = javaDate.toInstant()
                                .atZone(ZoneId.systemDefault())
                                .toLocalDate();
                    }
                } else {
                    // CellType.STRING 혹은 기타 → DataFormatter 로 문자열 얻기
                    String dateString = formatter.formatCellValue(dateCell).trim();
                    if (dateString.isEmpty()) {
                        // 빈 문자열이면 건너뛴다
                        continue;
                    }
                    // “소계”, “이월잔액” 같이 날짜가 아닌 텍스트가 들어있는 경우에도 건너뛴다
                    if (dateString.equalsIgnoreCase("소계") ||
                            dateString.equalsIgnoreCase("이월잔액")) {
                        continue;
                    }

                    // “2025/01/02” vs “2025-06-01” 둘 다 파싱 처리
                    if (dateString.contains("/")) {
                        localDate = LocalDate.parse(dateString, FORMAT_SLASH);
                    } else {
                        localDate = LocalDate.parse(dateString, FORMAT_HYPHEN);
                    }
                }

                // ───────────────────────────────────────────────────────────
                // ② 주문번호 (String)
                // ───────────────────────────────────────────────────────────
                Cell orderIdCell = row.getCell(2);  // 실제 위치에 맞게 인덱스 조정
                String orderId = "";
                if (orderIdCell != null) {
                    orderId = formatter.formatCellValue(orderIdCell).trim();
                }

                // ───────────────────────────────────────────────────────────
                // ③ 수량 (Integer)
                // ───────────────────────────────────────────────────────────
                Cell qtyCell = row.getCell(5);  // 실제 인덱스(“수량”) 확인
                int qty = 0;
                if (qtyCell != null) {
                    if (qtyCell.getCellType() == CellType.NUMERIC) {
                        qty = (int) qtyCell.getNumericCellValue();
                    } else {
                        String tmp = formatter.formatCellValue(qtyCell).trim();
                        if (!tmp.isEmpty()) {
                            try {
                                qty = Integer.parseInt(tmp);
                            } catch (NumberFormatException ex) {
                                qty = 0;
                            }
                        }
                    }
                }

                // ───────────────────────────────────────────────────────────
                // ④ 단가 (BigDecimal)
                // ───────────────────────────────────────────────────────────
                Cell unitPriceCell = row.getCell(7);  // 인덱스(“단가”) 맞춰서
                BigDecimal unitPrice = BigDecimal.ZERO;
                if (unitPriceCell != null) {
                    if (unitPriceCell.getCellType() == CellType.NUMERIC) {
                        unitPrice = BigDecimal.valueOf(unitPriceCell.getNumericCellValue());
                    } else {
                        String tmp = formatter.formatCellValue(unitPriceCell).trim().replaceAll(",", "");
                        if (!tmp.isEmpty()) {
                            try {
                                unitPrice = new BigDecimal(tmp);
                            } catch (NumberFormatException ex) {
                                unitPrice = BigDecimal.ZERO;
                            }
                        }
                    }
                }

                // ───────────────────────────────────────────────────────────
                // ⑤ 합계금액 (BigDecimal)
                // ───────────────────────────────────────────────────────────
                Cell amountCell = row.getCell(8);  // 인덱스(“합계금액”) 맞춰서
                BigDecimal amount = BigDecimal.ZERO;
                if (amountCell != null) {
                    if (amountCell.getCellType() == CellType.NUMERIC) {
                        amount = BigDecimal.valueOf(amountCell.getNumericCellValue());
                    } else {
                        String tmp = formatter.formatCellValue(amountCell).trim().replaceAll(",", "");
                        if (!tmp.isEmpty()) {
                            try {
                                amount = new BigDecimal(tmp);
                            } catch (NumberFormatException ex) {
                                amount = BigDecimal.ZERO;
                            }
                        }
                    }
                }

                // ───────────────────────────────────────────────────────────
                // ⑥ 비고 (String)
                // ───────────────────────────────────────────────────────────
                Cell remarksCell = row.getCell(13); // 예: 인덱스(“비고”)
                String remarks = "";
                if (remarksCell != null) {
                    remarks = formatter.formatCellValue(remarksCell).trim();
                }

                // ───────────────────────────────────────────────────────────
                // ⑦ 엔티티 생성 후 리스트에 추가
                // ───────────────────────────────────────────────────────────
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

            // DB에 일괄 저장
            ledgerRepo.saveAll(entries);
        }
    }
}

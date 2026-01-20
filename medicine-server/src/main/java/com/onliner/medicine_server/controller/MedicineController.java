// src/main/java/com/onliner/medicine_server/controller/MedicineController.java
package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.Medicine;
import com.onliner.medicine_server.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;

@CrossOrigin(origins = "http://localhost:3000")  // React 프론트엔드가 3000번 포트에서 호출할 경우
@RestController
@RequestMapping("/api/medicines")
@Profile("!render-nodb")
public class MedicineController {

    @Autowired
    private MedicineRepository medicineRepository;

    // 전체 조회 (optional: ?name=검색어)
    @GetMapping
    public List<Medicine> getAllMedicines(@RequestParam(required = false) String name) {
        if (name != null && !name.isEmpty()) {
            // 이름 검색 기능 (필요 시 enable)
            // return medicineRepository.findByNameContainingIgnoreCase(name);
            return medicineRepository.findAll().stream()
                    .filter(m -> m.getName().toLowerCase().contains(name.toLowerCase()))
                    .toList();
        }
        return medicineRepository.findAll();
    }

    // ------------- 엑셀 업로드 & 중복 처리 로직 -------------
    // POST /api/medicines/upload
    @PostMapping("/upload")
    public ResponseEntity<?> uploadExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("파일이 없습니다.");
        }

        try (InputStream is = file.getInputStream()) {
            Workbook workbook = new XSSFWorkbook(is);
            Sheet sheet = workbook.getSheetAt(0);
            List<Medicine> listToSave = new ArrayList<>();

            // 엑셀 첫 번째 행(0번)은 헤더라고 가정 → 두 번째 행(1)부터 데이터
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                // “No” 칼럼(인덱스 0)이 숫자가 아니면 건너뛰기
                Cell noCell = row.getCell(0);
                if (noCell == null || noCell.getCellType() != CellType.NUMERIC) {
                    continue;
                }

                Integer no = (int) noCell.getNumericCellValue();
                String code = getCellStringValue(row.getCell(3)); // “코드” 칼럼

                // (1) 중복 검사: 이미 DB에 같은 no나 code가 존재하는지 확인
                Optional<Medicine> existingByCode = medicineRepository.findByCode(code);
                Optional<Medicine> existingByNo   = medicineRepository.findByNo(no);

                Medicine medEntity;
                if (existingByCode.isPresent()) {
                    // 코드 기준으로 이미 존재 → 기존 엔티티 업데이트
                    medEntity = existingByCode.get();
                }
                else if (existingByNo.isPresent()) {
                    // no 기준으로 이미 존재 → 기존 엔티티 업데이트
                    medEntity = existingByNo.get();
                }
                else {
                    // (2) 완전히 새로 추가하는 경우
                    medEntity = new Medicine();
                    medEntity.setNo(no);
                    medEntity.setCode(code);
                }

                // 공통: 필드 덮어쓰기 (신규든 기존이든 다시 세팅)
                medEntity.setSupplier(getCellStringValue(row.getCell(1)));     // 입고처
                medEntity.setManufacturer(getCellStringValue(row.getCell(2))); // 제조사
                medEntity.setName(getCellStringValue(row.getCell(4)));         // 제품명
                medEntity.setSpec(getCellStringValue(row.getCell(5)));         // 규격
                medEntity.setBasePrice(getCellDoubleValue(row.getCell(6)));    // 기준가
                medEntity.setLocation(getCellStringValue(row.getCell(7)));     // 재고위치
                medEntity.setPrevStock(getCellDoubleValue(row.getCell(8)));    // 전일재고
                medEntity.setPrevAmount(getCellDoubleValue(row.getCell(9)));   // 전일금액
                medEntity.setInQty(getCellDoubleValue(row.getCell(10)));       // 입고수량
                medEntity.setInAmount(getCellDoubleValue(row.getCell(11)));    // 입고금액
                medEntity.setOutQty(getCellDoubleValue(row.getCell(12)));      // 출고수량
                medEntity.setOutAmount(getCellDoubleValue(row.getCell(13)));   // 출고금액
                medEntity.setStockQty(getCellDoubleValue(row.getCell(14)));    // 재고수량
                medEntity.setPurchasedQty(getCellDoubleValue(row.getCell(15))); // 매입처집계수량
                medEntity.setUnitPrice(getCellDoubleValue(row.getCell(16)));   // 단가
                medEntity.setBasePricePercent(getCellDoubleValue(row.getCell(17))); // 기준가%
                medEntity.setStockAmount(getCellDoubleValue(row.getCell(18))); // 재고금액
                medEntity.setBasePriceCode(getCellStringValue(row.getCell(19))); // 기준가코드
                medEntity.setRemarks(getCellStringValue(row.getCell(20)));      // 비고
                medEntity.setStandardCode(getCellStringValue(row.getCell(21))); // 표준코드
                medEntity.setProductLocation(getCellStringValue(row.getCell(22))); // 제품위치

                listToSave.add(medEntity);
            }

            // 한 번에 모두 저장 (insert or update)
            medicineRepository.saveAll(listToSave);

            workbook.close();
            return ResponseEntity.ok("엑셀 업로드 및 저장/업데이트 성공 (" + listToSave.size() + "건 처리됨)");
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("엑셀 처리 실패: " + e.getMessage());
        }
    }
    // 3) 개별 재고 수정: PUT /api/medicines/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMedicine(
            @PathVariable Long id,
            @RequestBody Medicine incoming) {

        // 3-1. 먼저 DB에서 해당 id가 있는지 조회
        Optional<Medicine> optional = medicineRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("해당 ID의 약품을 찾을 수 없습니다. id=" + id);
        }

        // 3-2. 기존 엔티티를 꺼내서, 필드 덮어쓰기
        Medicine exist = optional.get();
        exist.setSupplier(incoming.getSupplier());
        exist.setManufacturer(incoming.getManufacturer());
        exist.setName(incoming.getName());
        exist.setSpec(incoming.getSpec());
        exist.setBasePrice(incoming.getBasePrice());
        exist.setLocation(incoming.getLocation());
        exist.setPrevStock(incoming.getPrevStock());
        exist.setPrevAmount(incoming.getPrevAmount());
        exist.setInQty(incoming.getInQty());
        exist.setInAmount(incoming.getInAmount());
        exist.setOutQty(incoming.getOutQty());
        exist.setOutAmount(incoming.getOutAmount());
        exist.setStockQty(incoming.getStockQty());
        exist.setPurchasedQty(incoming.getPurchasedQty());
        exist.setUnitPrice(incoming.getUnitPrice());
        exist.setBasePricePercent(incoming.getBasePricePercent());
        exist.setStockAmount(incoming.getStockAmount());
        exist.setBasePriceCode(incoming.getBasePriceCode());
        exist.setRemarks(incoming.getRemarks());
        exist.setStandardCode(incoming.getStandardCode());
        exist.setProductLocation(incoming.getProductLocation());
        // → 필요 없는 필드, 즉 수정할 의도가 없으면 해당 setter는 생략해도 됩니다.

        // 3-3. 저장
        medicineRepository.save(exist);

        return ResponseEntity.ok(exist);
    }

    // (선택) 4) 개별 조회: GET /api/medicines/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getOneMedicine(@PathVariable Long id) {
        Optional<Medicine> optional = medicineRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("해당 ID의 약품을 찾을 수 없습니다. id=" + id);
        }
        return ResponseEntity.ok(optional.get());
    }
    // ======================= 헬퍼 메서드들 =======================
    // 셀에서 문자열을 안전하게 읽어서 반환
    private String getCellStringValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue();
        }
        else if (cell.getCellType() == CellType.NUMERIC) {
            // 숫자가 들어있더라도 문자열로 보고 싶으면 toString()
            return String.valueOf(cell.getNumericCellValue());
        }
        else {
            return "";
        }
    }

    // 셀에서 숫자를 안전하게 Double로 변환해서 반환
    private Double getCellDoubleValue(Cell cell) {
        if (cell == null) {
            return 0.0;
        }
        if (cell.getCellType() == CellType.STRING) {
            try {
                // 쉼표(,)가 들어갈 수도 있으므로 제거
                return Double.parseDouble(cell.getStringCellValue().replaceAll(",", ""));
            } catch (NumberFormatException ex) {
                return 0.0;
            }
        }
        else if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        }
        else {
            return 0.0;
        }
    }
    // =========================================================
}

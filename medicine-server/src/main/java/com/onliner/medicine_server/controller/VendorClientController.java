// src/main/java/com/onliner/medicine_server/controller/VendorClientController.java
package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.VendorClient;
import com.onliner.medicine_server.repository.VendorClientRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/vendors/clients")
@CrossOrigin(origins = "http://localhost:3000")

public class VendorClientController {

    @Autowired
    private VendorClientRepository clientRepo;

    // 1) 전체 조회 (옵션: ?q=검색어)
    @GetMapping
    public List<VendorClient> getAllClients(@RequestParam(required = false) String q) {
        if (q != null && !q.isEmpty()) {
            List<VendorClient> byCode = clientRepo.findByCodeContainingIgnoreCase(q);
            List<VendorClient> byName = clientRepo.findByNameOriginalContainingIgnoreCase(q);
            List<VendorClient> byBiz  = clientRepo.findByBusinessNumberContaining(q);

            // 세 리스트를 합치되, 순서를 유지하며 중복 제거
            Set<VendorClient> set = new LinkedHashSet<>();
            set.addAll(byCode);
            set.addAll(byName);
            set.addAll(byBiz);
            return new ArrayList<>(set);
        }
        return clientRepo.findAll();
    }

    // 2) 신규 저장
    @PostMapping
    public ResponseEntity<?> createClient(@RequestBody VendorClient client) {
        try {
            // LocalDate 필드(dob, startDate)는 JSON 문자열 "YYYY-MM-DD"가 들어올 때 스프링이 자동 변환해 줍니다.
            VendorClient saved = clientRepo.save(client);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "저장 실패", "detail", e.getMessage()));
        }
    }

    // 3) 수정(PATCH)
    @PatchMapping("/{id}")
    public ResponseEntity<?> updateClient(
            @PathVariable Long id,
            @RequestBody VendorClient incoming) {

        Optional<VendorClient> opt = clientRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        VendorClient exist = opt.get();

        // 모든 필드를 덮어쓰기하거나, 필요한 필드만 덮어써도 무방합니다.
        exist.setClassification(incoming.getClassification());
        exist.setCode(incoming.getCode());
        exist.setNameInternal(incoming.getNameInternal());
        exist.setNameOriginal(incoming.getNameOriginal());
        exist.setRepresentative(incoming.getRepresentative());
        exist.setDob(incoming.getDob());
        exist.setBusinessNumber(incoming.getBusinessNumber());
        exist.setPhone(incoming.getPhone());
        exist.setFax(incoming.getFax());
        exist.setZip(incoming.getZip());
        exist.setAddress(incoming.getAddress());
        exist.setSalesRep(incoming.getSalesRep());
        exist.setDeptHead(incoming.getDeptHead());
        exist.setPriceApply(incoming.getPriceApply());
        exist.setStockApply(incoming.getStockApply());
        exist.setInvoiceIssue(incoming.getInvoiceIssue());
        exist.setBusinessType(incoming.getBusinessType());
        exist.setItem(incoming.getItem());
        exist.setClientType(incoming.getClientType());
        exist.setClientGroup(incoming.getClientGroup());
        exist.setContractType(incoming.getContractType());
        exist.setDeliveryType(incoming.getDeliveryType());
        exist.setPharmacist(incoming.getPharmacist());
        exist.setLicenseNo(incoming.getLicenseNo());
        exist.setCareNo(incoming.getCareNo());
        exist.setNarcoticsId(incoming.getNarcoticsId());
        exist.setDeviceClient(incoming.getDeviceClient());
        exist.setContact(incoming.getContact());
        exist.setEmail(incoming.getEmail());
        exist.setInvoiceManager(incoming.getInvoiceManager());
        exist.setManagerPhone(incoming.getManagerPhone());
        exist.setCreditLimit(incoming.getCreditLimit());
        exist.setMaxTurnDays(incoming.getMaxTurnDays());
        exist.setMonthlyEstimate(incoming.getMonthlyEstimate());
        exist.setStartDate(incoming.getStartDate());
        exist.setNote1(incoming.getNote1());
        exist.setNote2(incoming.getNote2());
        exist.setActive(incoming.getActive());
        exist.setEInvoice(incoming.getEInvoice());
        exist.setInvoiceSystem(incoming.getInvoiceSystem());
        exist.setExternalExclude(incoming.getExternalExclude());
        exist.setPrePayment(incoming.getPrePayment());

        clientRepo.save(exist);
        return ResponseEntity.ok(exist);
    }

    // 4) 엑셀 업로드 & 일괄 저장 (POST /api/vendors/clients/upload)
    @PostMapping("/upload")
    public ResponseEntity<?> uploadExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "파일이 없습니다."));
        }

        try (InputStream is = file.getInputStream()) {
            Workbook workbook = new XSSFWorkbook(is);
            Sheet sheet = workbook.getSheetAt(0);
            List<VendorClient> listToSave = new ArrayList<>();

            // 헤더는 0번 행, 데이터는 1번 행부터
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                // 필수: “코드”(인덱스 1)가 비어 있으면 건너뛰기
                Cell codeCell = row.getCell(1);
                if (codeCell == null || codeCell.getCellType() == CellType.BLANK) {
                    continue;
                }
                String code = getCellStringValue(codeCell);

                // 중복 검사: code 기준
                Optional<VendorClient> existing = clientRepo.findByCodeContainingIgnoreCase(code)
                        .stream().findFirst();
                VendorClient entity = existing.orElseGet(VendorClient::new);
                if (entity.getId() == null) {
                    entity.setCode(code);
                }

                // 필드 매핑 (clientFields 배열 순서와 일치해야 합니다)
                entity.setClassification(getCellStringValue(row.getCell(0)));
                entity.setNameInternal(getCellStringValue(row.getCell(2)));
                entity.setNameOriginal(getCellStringValue(row.getCell(3)));
                entity.setRepresentative(getCellStringValue(row.getCell(4)));

                // 생년월일 (CellType.STRING 또는 CellType.NUMERIC 처리)
                String dobStr = getCellStringValue(row.getCell(5));
                if (!dobStr.isEmpty()) {
                    entity.setDob(LocalDate.parse(dobStr));
                }

                entity.setBusinessNumber(getCellStringValue(row.getCell(6)));
                entity.setPhone(getCellStringValue(row.getCell(7)));
                entity.setFax(getCellStringValue(row.getCell(8)));
                entity.setZip(getCellStringValue(row.getCell(9)));
                entity.setAddress(getCellStringValue(row.getCell(10)));
                entity.setSalesRep(getCellStringValue(row.getCell(11)));
                entity.setDeptHead(getCellStringValue(row.getCell(12)));
                entity.setPriceApply(getCellStringValue(row.getCell(13)));
                entity.setStockApply(getCellStringValue(row.getCell(14)));
                entity.setInvoiceIssue(getCellStringValue(row.getCell(15)).equalsIgnoreCase("true"));
                entity.setBusinessType(getCellStringValue(row.getCell(16)));
                entity.setItem(getCellStringValue(row.getCell(17)));
                entity.setClientType(getCellStringValue(row.getCell(18)));
                entity.setClientGroup(getCellStringValue(row.getCell(19)));
                entity.setContractType(getCellStringValue(row.getCell(20)));
                entity.setDeliveryType(getCellStringValue(row.getCell(21)));
                entity.setPharmacist(getCellStringValue(row.getCell(22)));
                entity.setLicenseNo(getCellStringValue(row.getCell(23)));
                entity.setCareNo(getCellStringValue(row.getCell(24)));
                entity.setNarcoticsId(getCellStringValue(row.getCell(25)));
                entity.setDeviceClient(getCellStringValue(row.getCell(26)));
                entity.setContact(getCellStringValue(row.getCell(27)));
                entity.setEmail(getCellStringValue(row.getCell(28)));
                entity.setInvoiceManager(getCellStringValue(row.getCell(29)));
                entity.setManagerPhone(getCellStringValue(row.getCell(30)));
                entity.setCreditLimit(getCellDoubleValue(row.getCell(31)));

                Double maxTurn = getCellDoubleValue(row.getCell(32));
                if (maxTurn != null) {
                    entity.setMaxTurnDays(maxTurn.intValue());
                }
                Double monthlyEst = getCellDoubleValue(row.getCell(33));
                if (monthlyEst != null) {
                    entity.setMonthlyEstimate(monthlyEst.intValue());
                }

                String startDateStr = getCellStringValue(row.getCell(34));
                if (!startDateStr.isEmpty()) {
                    entity.setStartDate(LocalDate.parse(startDateStr));
                }

                entity.setNote1(getCellStringValue(row.getCell(35)));
                entity.setNote2(getCellStringValue(row.getCell(36)));
                entity.setActive(getCellStringValue(row.getCell(37)).equalsIgnoreCase("true"));
                entity.setEInvoice(getCellStringValue(row.getCell(38)).equalsIgnoreCase("true"));
                entity.setInvoiceSystem(getCellStringValue(row.getCell(39)));
                entity.setExternalExclude(getCellStringValue(row.getCell(40)).equalsIgnoreCase("true"));
                entity.setPrePayment(getCellStringValue(row.getCell(41)).equalsIgnoreCase("true"));

                listToSave.add(entity);
            }

            clientRepo.saveAll(listToSave);
            workbook.close();
            return ResponseEntity.ok(Map.of("message", "엑셀 업로드 성공 (" + listToSave.size() + "건)"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "엑셀 처리 실패", "detail", e.getMessage()));
        }
    }

    // ─── 헬퍼 메서드: 셀에서 문자열 읽기 ─────────────────────────────────
    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue().trim();
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            // 날짜가 아닌 순수 숫자의 경우 long으로 캐스팅
            return String.valueOf((long) cell.getNumericCellValue());
        }
        return "";
    }

    // ─── 헬퍼 메서드: 셀에서 숫자(Double)로 변환 ────────────────────────────────
    private Double getCellDoubleValue(Cell cell) {
        if (cell == null) return 0.0;
        if (cell.getCellType() == CellType.STRING) {
            try {
                return Double.parseDouble(cell.getStringCellValue().replaceAll(",", "").trim());
            } catch (NumberFormatException ex) {
                return 0.0;
            }
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        }
        return 0.0;
    }
}

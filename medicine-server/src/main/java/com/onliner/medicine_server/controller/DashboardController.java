package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.Medicine;
import com.onliner.medicine_server.repository.MedicineRepository;
import com.onliner.medicine_server.repository.PdfAssignmentRepository;
import com.onliner.medicine_server.repository.VendorLedgerEntryRepository;
import io.jsonwebtoken.Claims;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Profile("!render-nodb")
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final MedicineRepository medicineRepository;
    private final VendorLedgerEntryRepository ledgerRepository;
    private final PdfAssignmentRepository pdfAssignmentRepository;

    public DashboardController(MedicineRepository medicineRepository,
                               VendorLedgerEntryRepository ledgerRepository,
                               PdfAssignmentRepository pdfAssignmentRepository) {
        this.medicineRepository = medicineRepository;
        this.ledgerRepository = ledgerRepository;
        this.pdfAssignmentRepository = pdfAssignmentRepository;
    }

    // 도매업체 대시보드 데이터
    @GetMapping("/vendor")
    public ResponseEntity<Map<String, Object>> vendorDashboard(Authentication auth) {
        Claims claims = (Claims) auth.getDetails();
        String companyCode = claims.get("companyCode", String.class);

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        // 오늘 매출 / 어제 매출
        BigDecimal todaySales = ledgerRepository.sumTodaySales(today);
        BigDecimal yesterdaySales = ledgerRepository.sumDaySales(yesterday);

        double changeRate = 0.0;
        if (yesterdaySales.compareTo(BigDecimal.ZERO) > 0) {
            changeRate = todaySales.subtract(yesterdaySales)
                    .divide(yesterdaySales, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        // 재고 부족 품목 (stockQty <= 30)
        List<Medicine> lowStockMedicines = medicineRepository.findLowStockItems(30);
        List<Map<String, Object>> lowStockItems = lowStockMedicines.stream()
                .limit(10)
                .map(m -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("code", m.getCode());
                    item.put("name", m.getName());
                    item.put("stock", m.getStockQty() != null ? m.getStockQty().intValue() : 0);
                    item.put("threshold", 30);
                    return item;
                })
                .collect(Collectors.toList());

        // PDF 배정 수 (배송 진행 중 건수)
        long deliveryInProgress = pdfAssignmentRepository.count();

        Map<String, Object> result = new HashMap<>();
        result.put("todaySales", Map.of(
                "totalSales", todaySales,
                "changeRate", Math.round(changeRate * 10.0) / 10.0
        ));
        result.put("deliveryStats", Map.of(
                "pending", 0,
                "inProgress", (int) deliveryInProgress,
                "completed", 0
        ));
        result.put("lowStockItems", lowStockItems);
        result.put("unconfirmedInvoices", 0);

        return ResponseEntity.ok(result);
    }

    // 병원 대시보드 데이터
    @GetMapping("/hospital")
    public ResponseEntity<Map<String, Object>> hospitalDashboard(Authentication auth) {
        Claims claims = (Claims) auth.getDetails();
        String hospitalId = claims.get("hospitalId", String.class);

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        // 당월 미결제 합계
        BigDecimal monthTotal = ledgerRepository.sumAmountByHospitalIdAndDateBetween(
                hospitalId != null ? hospitalId : "", monthStart, today);

        // 최근 거래 5건
        List<Map<String, Object>> recentInvoices = ledgerRepository
                .findTop5ByHospitalIdOrderByDateDesc(hospitalId != null ? hospitalId : "")
                .stream()
                .map(e -> {
                    Map<String, Object> inv = new HashMap<>();
                    inv.put("id", "INV-" + e.getId());
                    inv.put("date", e.getDate().toString());
                    inv.put("amount", e.getAmount());
                    inv.put("status", "unread");
                    return inv;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("unreadInvoices", recentInvoices.size());
        result.put("pendingPayments", recentInvoices.size());
        result.put("totalUnpaid", monthTotal);
        result.put("recentInvoices", recentInvoices);

        return ResponseEntity.ok(result);
    }
}

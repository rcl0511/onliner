package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.Driver;
import com.onliner.medicine_server.entity.PdfAssignment;
import com.onliner.medicine_server.service.DeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Profile("!render-nodb")
public class DeliveryController {

    private final DeliveryService deliveryService;

    @Autowired
    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    // ==============================
    // (1) 모든 배송 기사 목록 조회
    // GET  /api/drivers
    // ==============================
    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> getDrivers() {
        List<Driver> list = deliveryService.getAllDrivers();
        return ResponseEntity.ok(list);
    }

    // ==============================
    // (2) PDF 할당 요청
    // POST /api/delivery/assign
    // Body: { "driverId": "driver1", "pdfKey": "auto-1627645123456-0" }
    // ==============================
    @PostMapping("/delivery/assign")
    public ResponseEntity<?> assignPdfToDriver(@RequestBody AssignRequest request) {
        try {
            deliveryService.assignPdfToDriver(request.driverId, request.pdfKey);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(iae.getMessage());
        } catch (IllegalStateException ise) {
            // 이미 할당된 pdfKey인 경우
            return ResponseEntity.status(409).body(ise.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("서버 오류: " + e.getMessage());
        }
    }

    // 요청 바디 매핑용 DTO
    public static class AssignRequest {
        public String driverId;
        public String pdfKey;
    }

    // ==============================
    // (3) 특정 기사에게 할당된 PDF 목록 조회
    // GET /api/delivery/assigned?driverId=driver1
    // ==============================
    @GetMapping("/delivery/assigned")
    public ResponseEntity<List<PdfAssignment>> getAssigned(
            @RequestParam String driverId) {
        try {
            List<PdfAssignment> list = deliveryService.getAssignmentsByDriver(driverId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}

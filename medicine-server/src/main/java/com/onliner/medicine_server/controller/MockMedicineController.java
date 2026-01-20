package com.onliner.medicine_server.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * render-nodb 프로파일에서 사용하는 Mock 컨트롤러
 * DB 없이 테스트 데이터를 반환합니다.
 */
@RestController
@RequestMapping("/api/medicines")
@Profile("render-nodb")
public class MockMedicineController {

    // Mock 의약품 데이터
    private List<Map<String, Object>> getMockMedicines() {
        List<Map<String, Object>> medicines = new ArrayList<>();
        
        for (int i = 1; i <= 20; i++) {
            medicines.add(Map.of(
                "id", (long) i,
                "name", "테스트제품" + (char)('A' + (i - 1) % 10),
                "code", "CODE" + String.format("%03d", i),
                "unitPrice", 1000 + (i * 100),
                "basePrice", 1000 + (i * 100),
                "manufacturer", "테스트제조사" + (char)('A' + (i - 1) % 10),
                "warehouseId", (i % 2) + 1,
                "stock", 100 + (i * 10)
            ));
        }
        
        return medicines;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllMedicines(
            @RequestParam(required = false) String name) {
        List<Map<String, Object>> medicines = getMockMedicines();
        
        if (name != null && !name.isEmpty()) {
            String lowerName = name.toLowerCase();
            medicines = medicines.stream()
                .filter(m -> m.get("name").toString().toLowerCase().contains(lowerName))
                .toList();
        }
        
        return ResponseEntity.ok(medicines);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMedicineById(@PathVariable Long id) {
        List<Map<String, Object>> medicines = getMockMedicines();
        Map<String, Object> medicine = medicines.stream()
            .filter(m -> m.get("id").equals(id))
            .findFirst()
            .orElse(null);
        
        if (medicine == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(medicine);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createMedicine(@RequestBody Map<String, Object> medicine) {
        // Mock 응답
        return ResponseEntity.ok(medicine);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateMedicine(
            @PathVariable Long id,
            @RequestBody Map<String, Object> medicine) {
        // Mock 응답
        return ResponseEntity.ok(medicine);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicine(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }
}

package com.onliner.medicine_server.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * render-nodb 프로파일에서 사용하는 Mock 배송 컨트롤러
 * DB 없이 테스트 데이터를 반환합니다.
 */
@RestController
@RequestMapping("/api")
@Profile("render-nodb")
public class MockDeliveryController {

    @GetMapping("/drivers")
    public ResponseEntity<List<Map<String, Object>>> getDrivers() {
        List<Map<String, Object>> drivers = new ArrayList<>();
        drivers.add(Map.of("id", "driver1", "name", "홍길동"));
        drivers.add(Map.of("id", "driver2", "name", "김철수"));
        drivers.add(Map.of("id", "driver3", "name", "이영희"));
        
        return ResponseEntity.ok(drivers);
    }

    @PostMapping("/delivery/assign")
    public ResponseEntity<?> assignPdfToDriver(@RequestBody Map<String, String> request) {
        // Mock 응답
        return ResponseEntity.ok().build();
    }

    @GetMapping("/delivery/assigned")
    public ResponseEntity<List<Map<String, Object>>> getAssigned(
            @RequestParam String driverId) {
        // Mock 응답
        return ResponseEntity.ok(new ArrayList<>());
    }
}

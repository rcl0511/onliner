package com.onliner.medicine_server.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * render-nodb 프로파일에서 사용하는 Mock 거래처 컨트롤러
 * DB 없이 테스트 데이터를 반환합니다.
 */
@RestController
@RequestMapping("/api/vendors/clients")
@Profile("render-nodb")
public class MockVendorClientController {

    // Mock 거래처 데이터
    private List<Map<String, Object>> getMockClients() {
        List<Map<String, Object>> clients = new ArrayList<>();
        
        for (int i = 1; i <= 10; i++) {
            clients.add(Map.of(
                "id", (long) i,
                "nameOriginal", "테스트병원" + (char)('A' + (i - 1)),
                "nameInternal", "테스트병원" + (char)('A' + (i - 1)),
                "code", "TEST" + String.format("%03d", i),
                "representative", "대표자" + i,
                "businessNumber", "123-45-6789" + i,
                "phone", "02-1234-567" + i,
                "address", "서울시 강남구 테스트로 " + i
            ));
        }
        
        return clients;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllClients(
            @RequestParam(required = false) String q) {
        List<Map<String, Object>> clients = getMockClients();
        
        if (q != null && !q.isEmpty()) {
            String lowerQ = q.toLowerCase();
            clients = clients.stream()
                .filter(c -> 
                    c.get("nameOriginal").toString().toLowerCase().contains(lowerQ) ||
                    c.get("code").toString().toLowerCase().contains(lowerQ) ||
                    c.get("businessNumber").toString().contains(q)
                )
                .toList();
        }
        
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getClientById(@PathVariable Long id) {
        List<Map<String, Object>> clients = getMockClients();
        Map<String, Object> client = clients.stream()
            .filter(c -> c.get("id").equals(id))
            .findFirst()
            .orElse(null);
        
        if (client == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(client);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createClient(@RequestBody Map<String, Object> client) {
        // Mock 응답
        return ResponseEntity.ok(client);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateClient(
            @PathVariable Long id,
            @RequestBody Map<String, Object> client) {
        // Mock 응답
        return ResponseEntity.ok(client);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }
}

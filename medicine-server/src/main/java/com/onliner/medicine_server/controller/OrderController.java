package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.Order;
import com.onliner.medicine_server.repository.OrderRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;

    /**
     * POST /api/orders
     * 병원이 주문서를 제출 (HOSPITAL role)
     */
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        Claims claims = extractClaims();

        String hospitalId = claims != null ? claims.get("hospitalId", String.class) : null;
        String hospitalName = claims != null ? claims.get("hospitalName", String.class) : null;

        String id = "ORDER-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        String vendorCode = (String) body.get("vendorCode");
        String vendorName = (String) body.get("vendorName");
        String itemsJson = body.containsKey("items") ? body.get("items").toString() : "[]";
        Object totalAmountRaw = body.get("totalAmount");
        long totalAmount = totalAmountRaw instanceof Number n ? n.longValue() : 0L;

        if (vendorCode == null || vendorCode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "vendorCode가 필요합니다."));
        }

        Order order = Order.builder()
                .id(id)
                .vendorCode(vendorCode)
                .vendorName(vendorName != null ? vendorName : "")
                .hospitalId(hospitalId != null ? hospitalId : "")
                .hospitalName(hospitalName != null ? hospitalName : (String) body.getOrDefault("hospitalName", ""))
                .totalAmount(totalAmount)
                .status("PENDING")
                .items(itemsJson)
                .createdAt(Instant.now())
                .build();

        orderRepository.save(order);
        return ResponseEntity.ok(Map.of("message", "주문이 접수되었습니다.", "orderId", id));
    }

    /**
     * GET /api/orders?vendorCode=
     * 도매업체가 자신에게 들어온 주문 조회 (VENDOR role)
     */
    @GetMapping
    public ResponseEntity<List<Order>> getOrders(@RequestParam(required = false) String vendorCode) {
        Claims claims = extractClaims();
        String code = vendorCode;

        // vendorCode 파라미터가 없으면 토큰에서 추출
        if ((code == null || code.isBlank()) && claims != null) {
            code = claims.get("companyCode", String.class);
        }

        if (code == null || code.isBlank()) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(orderRepository.findByVendorCodeOrderByCreatedAtDesc(code));
    }

    /**
     * PUT /api/orders/{id}/status
     * 도매업체가 주문 상태 변경 (ACCEPTED / REJECTED)
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equals("ACCEPTED") && !newStatus.equals("REJECTED"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "status는 ACCEPTED 또는 REJECTED여야 합니다."));
        }

        Optional<Order> opt = orderRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "주문을 찾을 수 없습니다."));
        }

        Order order = opt.get();
        if (!"PENDING".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "이미 처리된 주문입니다. (현재 상태: " + order.getStatus() + ")"));
        }
        order.setStatus(newStatus);
        orderRepository.save(order);
        return ResponseEntity.ok(Map.of("message", "상태가 변경되었습니다.", "status", newStatus));
    }

    private Claims extractClaims() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            return claims;
        }
        return null;
    }
}

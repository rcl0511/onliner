package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.Order;
import com.onliner.medicine_server.service.OrderService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * POST /api/orders
     * 병원이 주문서를 제출 (HOSPITAL role)
     */
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(orderService.createOrder(body, extractClaims()));
    }

    /**
     * GET /api/orders?vendorCode=
     * 도매업체가 자신에게 들어온 주문 조회 (VENDOR role)
     */
    @GetMapping
    public ResponseEntity<List<Order>> getOrders(@RequestParam(required = false) String vendorCode) {
        return ResponseEntity.ok(orderService.getVendorOrders(vendorCode, extractClaims()));
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
        return ResponseEntity.ok(orderService.updateStatus(id, body.get("status"), extractClaims()));
    }

    @Nullable
    private Claims extractClaims() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            return claims;
        }
        return null;
    }
}

package com.onliner.medicine_server.service;

import com.onliner.medicine_server.entity.Order;
import com.onliner.medicine_server.repository.OrderRepository;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Map<String, Object> createOrder(Map<String, Object> body, Claims claims) {
        String hospitalId = claims != null ? claims.get("hospitalId", String.class) : null;
        String hospitalName = claims != null ? claims.get("hospitalName", String.class) : null;

        String vendorCode = (String) body.get("vendorCode");
        String vendorName = (String) body.get("vendorName");
        String itemsJson = body.containsKey("items") ? body.get("items").toString() : "[]";
        Object totalAmountRaw = body.get("totalAmount");
        long totalAmount = totalAmountRaw instanceof Number n ? n.longValue() : 0L;

        if (vendorCode == null || vendorCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "vendorCode가 필요합니다.");
        }

        Order order = Order.builder()
                .id("ORDER-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase())
                .vendorCode(vendorCode)
                .vendorName(vendorName != null ? vendorName : "")
                .hospitalId(hospitalId != null ? hospitalId : "")
                .hospitalName(hospitalName != null ? hospitalName : (String) body.getOrDefault("hospitalName", ""))
                .totalAmount(totalAmount)
                .status("PENDING")
                .items(itemsJson)
                .createdAt(Instant.now())
                .build();

        Order saved = orderRepository.save(Objects.requireNonNull(order));
        return Map.of("message", "주문이 접수되었습니다.", "orderId", saved.getId());
    }

    public List<Order> getVendorOrders(String vendorCode, Claims claims) {
        String code = vendorCode;
        if ((code == null || code.isBlank()) && claims != null) {
            code = claims.get("companyCode", String.class);
        }
        if (code == null || code.isBlank()) {
            return List.of();
        }
        return orderRepository.findByVendorCodeOrderByCreatedAtDesc(code);
    }

    public Map<String, Object> updateStatus(String id, String newStatus, Claims claims) {
        if (newStatus == null || (!newStatus.equals("ACCEPTED") && !newStatus.equals("REJECTED"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status는 ACCEPTED 또는 REJECTED여야 합니다.");
        }

        Order order = orderRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."));

        String companyCode = claims != null ? claims.get("companyCode", String.class) : null;
        if (companyCode == null || !companyCode.equals(order.getVendorCode())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 주문을 처리할 권한이 없습니다.");
        }
        if (!"PENDING".equals(order.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "이미 처리된 주문입니다. (현재 상태: " + order.getStatus() + ")");
        }

        order.setStatus(newStatus);
        orderRepository.save(Objects.requireNonNull(order));
        return Map.of("message", "상태가 변경되었습니다.", "status", newStatus);
    }
}

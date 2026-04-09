package com.onliner.medicine_server.service;

import com.onliner.medicine_server.entity.Order;
import com.onliner.medicine_server.repository.OrderRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class OrderServiceTest {

    private final OrderRepository orderRepository = Mockito.mock(OrderRepository.class);
    private final OrderService orderService = new OrderService(orderRepository);

    @Test
    void updateStatusAllowsPendingOrderForOwningVendor() {
        Order order = Order.builder()
                .id("ORDER-1")
                .vendorCode("dh-pharm")
                .status("PENDING")
                .createdAt(Instant.parse("2026-04-08T00:00:00Z"))
                .build();
        when(orderRepository.findById("ORDER-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = orderService.updateStatus("ORDER-1", "ACCEPTED", vendorClaims("dh-pharm"));

        assertThat(result.get("status")).isEqualTo("ACCEPTED");
        assertThat(order.getStatus()).isEqualTo("ACCEPTED");
    }

    @Test
    void updateStatusRejectsAnotherVendorsOrder() {
        Order order = Order.builder()
                .id("ORDER-2")
                .vendorCode("dh-pharm")
                .status("PENDING")
                .createdAt(Instant.parse("2026-04-08T00:00:00Z"))
                .build();
        when(orderRepository.findById("ORDER-2")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateStatus("ORDER-2", "ACCEPTED", vendorClaims("other-pharm")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403 FORBIDDEN");
    }

    @Test
    void updateStatusRejectsAlreadyProcessedOrder() {
        Order order = Order.builder()
                .id("ORDER-3")
                .vendorCode("dh-pharm")
                .status("ACCEPTED")
                .createdAt(Instant.parse("2026-04-08T00:00:00Z"))
                .build();
        when(orderRepository.findById("ORDER-3")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateStatus("ORDER-3", "REJECTED", vendorClaims("dh-pharm")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("이미 처리된 주문");
    }

    private Claims vendorClaims(String companyCode) {
        Claims claims = Jwts.claims();
        claims.put("role", "VENDOR");
        claims.put("companyCode", companyCode);
        return claims;
    }
}

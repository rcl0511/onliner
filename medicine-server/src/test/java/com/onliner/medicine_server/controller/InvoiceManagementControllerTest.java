package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.InvoiceRecord;
import com.onliner.medicine_server.repository.InvoiceRecordRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Objects;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = InvoiceManagementController.class)
@Import(InvoiceManagementControllerTest.TestSecurityConfig.class)
class InvoiceManagementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InvoiceRecordRepository invoiceRecordRepository;

    @Test
    void disputeUpdateStoresStructuredAuditFields() throws Exception {
        InvoiceRecord existing = InvoiceRecord.builder()
                .id("INV-TEST-001")
                .vendorCode("vendor-1")
                .hospitalId("hospital-1")
                .status("SENT")
                .createdAt(Instant.parse("2026-04-08T00:00:00Z"))
                .build();

        when(invoiceRecordRepository.findById("INV-TEST-001")).thenReturn(Optional.of(existing));
        when(invoiceRecordRepository.save(any(InvoiceRecord.class))).thenAnswer(invocation -> firstInvoiceRecordArgument(invocation));

        mockMvc.perform(put("/api/invoice-records/INV-TEST-001/status")
                        .with(Objects.requireNonNull(authentication(TestSecurityConfig.hospitalAuth("hospital-1"))))
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content("""
                                {
                                  "status": "DISPUTED",
                                  "note": "[quantity] 2박스 누락",
                                  "disputeType": "quantity",
                                  "disputeMemo": "2박스 누락"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISPUTED"))
                .andExpect(jsonPath("$.processedByHospitalId").value("hospital-1"));

        ArgumentCaptor<InvoiceRecord> captor = ArgumentCaptor.forClass(InvoiceRecord.class);
        verify(invoiceRecordRepository).save(captor.capture());
        InvoiceRecord saved = Objects.requireNonNull(captor.getValue());

        assertThat(saved.getStatus()).isEqualTo("DISPUTED");
        assertThat(saved.getProcessedByHospitalId()).isEqualTo("hospital-1");
        assertThat(saved.getDisputeType()).isEqualTo("quantity");
        assertThat(saved.getDisputeMemo()).isEqualTo("2박스 누락");
        assertThat(saved.getStatusChangedAt()).isNotNull();
        assertThat(saved.getDisputedAt()).isNotNull();
    }

    @Test
    void disputeUpdateRejectsMissingStructuredReason() throws Exception {
        InvoiceRecord existing = InvoiceRecord.builder()
                .id("INV-TEST-002")
                .vendorCode("vendor-1")
                .hospitalId("hospital-1")
                .status("SENT")
                .createdAt(Instant.parse("2026-04-08T00:00:00Z"))
                .build();

        when(invoiceRecordRepository.findById("INV-TEST-002")).thenReturn(Optional.of(existing));

        mockMvc.perform(put("/api/invoice-records/INV-TEST-002/status")
                        .with(Objects.requireNonNull(authentication(TestSecurityConfig.hospitalAuth("hospital-1"))))
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content("""
                                {
                                  "status": "DISPUTED",
                                  "note": "메모만 있음"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("이의 신청 시 disputeType과 disputeMemo가 필요합니다."));
    }

    static class TestSecurityConfig {
        static UsernamePasswordAuthenticationToken hospitalAuth(String hospitalId) {
            Claims claims = Jwts.claims();
            claims.put("hospitalId", hospitalId);
            claims.put("role", "HOSPITAL");
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken("hospital-user", "token", java.util.List.of());
            auth.setDetails(claims);
            return auth;
        }

        @org.springframework.context.annotation.Bean
        SecurityFilterChain securityFilterChain(org.springframework.security.config.annotation.web.builders.HttpSecurity http) throws Exception {
            return http
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                    .build();
        }
    }

    private InvoiceRecord firstInvoiceRecordArgument(org.mockito.invocation.InvocationOnMock invocation) {
        return Objects.requireNonNull(invocation.getArgument(0, InvoiceRecord.class));
    }
}

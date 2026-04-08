package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.service.SupabaseStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Objects;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = InvoiceController.class)
@Import(InvoiceControllerTest.TestSecurityConfig.class)
class InvoiceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SupabaseStorageService storageService;

    @Test
    void downloadPdfStreamsBytesThroughServer() throws Exception {
        byte[] payload = "pdf-binary".getBytes();
        when(storageService.downloadFile("invoice-test.pdf")).thenReturn(payload);

        mockMvc.perform(get("/api/invoices/exports/invoice-test.pdf"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoice-test.pdf\""))
                .andExpect(content().contentType(Objects.requireNonNull(MediaType.APPLICATION_PDF)))
                .andExpect(content().bytes(Objects.requireNonNull(payload)));
    }

    static class TestSecurityConfig {
        @org.springframework.context.annotation.Bean
        SecurityFilterChain securityFilterChain(org.springframework.security.config.annotation.web.builders.HttpSecurity http) throws Exception {
            return http
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                    .build();
        }
    }
}

package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.Signature;
import com.onliner.medicine_server.repository.SignatureRepository;
import com.onliner.medicine_server.service.SupabaseStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SignatureController.class)
@Import(SignatureControllerTest.TestSecurityConfig.class)
class SignatureControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SignatureRepository signatureRepository;

    @MockitoBean
    private SupabaseStorageService storageService;

    @Test
    @SuppressWarnings("null")
    void saveSignatureFallsBackToDatabaseWhenStorageFails() throws Exception {
        when(signatureRepository.findByInvoiceId("INV-SIGN-001")).thenReturn(Optional.empty());
        when(signatureRepository.save(any(Signature.class))).thenAnswer(this::savedSignatureAnswer);
        when(storageService.uploadImage(any(byte[].class), anyString())).thenThrow(new RuntimeException("storage down"));

        String dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxioAAAAASUVORK5CYII=";

        mockMvc.perform(post("/api/invoices/INV-SIGN-001/signature")
                        .with(Objects.requireNonNull(authentication(TestSecurityConfig.hospitalAuth("hospital-9"))))
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .content(Objects.requireNonNull(objectMapper.writeValueAsBytes(Map.of(
                                "imageDataUrl", dataUrl,
                                "metadata", "{\"source\":\"test\"}"
                        )))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storageType").value("database"))
                .andExpect(jsonPath("$.imageDataUrl").value(dataUrl));

        ArgumentCaptor<Signature> captor = ArgumentCaptor.forClass(Signature.class);
        verify(signatureRepository).save(captor.capture());
        Signature saved = capturedSignature(captor);

        assertThat(saved.getHospitalId()).isEqualTo("hospital-9");
        assertThat(saved.getImageUrl()).isNull();
        assertThat(saved.getImageData()).isEqualTo(dataUrl);
        assertThat(saved.getSignedAt()).isNotNull();
    }

    @Test
    void getSignatureReturnsStoredFallbackImageData() throws Exception {
        Signature existing = Signature.builder()
                .invoiceId("INV-SIGN-002")
                .imageData("data:image/png;base64,abc123")
                .metadata("{\"source\":\"db\"}")
                .signedAt(Instant.parse("2026-04-08T00:00:00Z"))
                .build();

        when(signatureRepository.findByInvoiceId("INV-SIGN-002")).thenReturn(Optional.of(existing));

        mockMvc.perform(get("/api/invoices/INV-SIGN-002/signature")
                        .with(Objects.requireNonNull(authentication(TestSecurityConfig.hospitalAuth("hospital-1")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageDataUrl").value("data:image/png;base64,abc123"))
                .andExpect(jsonPath("$.metadata").value("{\"source\":\"db\"}"));
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

    private Signature firstSignatureArgument(org.mockito.invocation.InvocationOnMock invocation) {
        return Objects.requireNonNull(invocation.getArgument(0, Signature.class));
    }

    private Signature savedSignatureAnswer(org.mockito.invocation.InvocationOnMock invocation) {
        Signature signature = firstSignatureArgument(invocation);
        return Objects.requireNonNull(signature);
    }

    private Signature capturedSignature(ArgumentCaptor<Signature> captor) {
        Signature signature = captor.getValue();
        return Objects.requireNonNull(signature);
    }
}

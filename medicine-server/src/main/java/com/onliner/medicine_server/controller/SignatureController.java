package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.Signature;
import com.onliner.medicine_server.repository.SignatureRepository;
import com.onliner.medicine_server.service.SupabaseStorageService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class SignatureController {

    private final SignatureRepository signatureRepository;
    private final SupabaseStorageService storageService;

    /**
     * POST /api/invoices/{invoiceId}/signature
     * 서명 이미지(base64 PNG)를 Supabase에 업로드하고 DB에 저장
     */
    @PostMapping("/{invoiceId}/signature")
    public ResponseEntity<?> saveSignature(
            @PathVariable String invoiceId,
            @RequestBody Map<String, Object> body
    ) {
        String hospitalId = extractHospitalId();
        String imageDataUrl = (String) body.get("imageDataUrl"); // data:image/png;base64,...
        String metadata = body.containsKey("metadata")
                ? body.get("metadata").toString()
                : "{}";

        if (imageDataUrl == null || !imageDataUrl.startsWith("data:image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "유효한 이미지 데이터가 필요합니다."));
        }

        try {
            // base64 디코딩
            String base64 = imageDataUrl.substring(imageDataUrl.indexOf(",") + 1);
            byte[] imageBytes = Base64.getDecoder().decode(base64);

            // Supabase에 signatures/ 경로로 업로드
            String filename = "signatures/" + invoiceId + "_" + System.currentTimeMillis() + ".png";
            String imageUrl = storageService.uploadImage(imageBytes, filename);

            // 기존 서명이 있으면 업데이트, 없으면 새로 저장
            Signature signature = signatureRepository.findByInvoiceId(invoiceId)
                    .orElse(Signature.builder()
                            .invoiceId(invoiceId)
                            .build());

            signature.setHospitalId(hospitalId);
            signature.setImageUrl(imageUrl);
            signature.setMetadata(metadata);
            signature.setSignedAt(Instant.now());

            signatureRepository.save(signature);

            return ResponseEntity.ok(Map.of(
                    "message", "서명이 저장되었습니다.",
                    "imageUrl", imageUrl,
                    "invoiceId", invoiceId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "서명 저장 실패: " + e.getMessage()));
        }
    }

    /**
     * GET /api/invoices/{invoiceId}/signature
     * 저장된 서명 조회
     */
    @GetMapping("/{invoiceId}/signature")
    public ResponseEntity<?> getSignature(@PathVariable String invoiceId) {
        Optional<Signature> sig = signatureRepository.findByInvoiceId(invoiceId);
        if (sig.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Signature s = sig.get();
        return ResponseEntity.ok(Map.of(
                "invoiceId", s.getInvoiceId(),
                "imageUrl", s.getImageUrl() != null ? s.getImageUrl() : "",
                "metadata", s.getMetadata() != null ? s.getMetadata() : "{}",
                "signedAt", s.getSignedAt() != null ? s.getSignedAt().toString() : ""
        ));
    }

    private String extractHospitalId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            String hospitalId = claims.get("hospitalId", String.class);
            return hospitalId != null ? hospitalId : auth.getName();
        }
        return "unknown";
    }
}

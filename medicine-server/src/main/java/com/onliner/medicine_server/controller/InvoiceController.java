package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.service.SupabaseStorageService;
import com.onliner.medicine_server.util.PdfUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.*;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final SupabaseStorageService storageService;

    public InvoiceController(SupabaseStorageService storageService) {
        this.storageService = storageService;
    }

    @GetMapping("/exports/{filename:.+}")
    public ResponseEntity<?> downloadPdf(@PathVariable String filename) {
        String publicUrl = storageService.getPublicUrl(filename);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", publicUrl)
                .build();
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadSingle(@RequestPart("invoice") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "업로드할 PDF 파일이 없습니다."));
        }

        File tempFile = null;
        File outputFile = null;
        try {
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "invoice.pdf";

            tempFile = File.createTempFile("invoice_", ".pdf");
            Files.copy(file.getInputStream(), tempFile.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String parsedText = PdfUtil.parseAndDedupeText(tempFile);
            String hospitalName = PdfUtil.extractHospitalName(parsedText, originalName);
            String orderDate = PdfUtil.extractOrderDate(parsedText);

            String safeHosp = hospitalName.replaceAll("[^가-힣a-zA-Z0-9_-]", "");
            String finalFilename = safeHosp + "_" + orderDate + ".pdf";

            outputFile = File.createTempFile("output_", ".pdf");
            String publicUrl;
            try {
                String templatePath = Objects.requireNonNull(
                    getClass().getClassLoader().getResource("templates/거래명세서_양식.pdf")
                ).getPath();
                PdfUtil.overlayTemplate(templatePath, tempFile.getAbsolutePath(), outputFile.getAbsolutePath());
                publicUrl = storageService.uploadPdf(Files.readAllBytes(outputFile.toPath()), finalFilename);
            } catch (Exception e) {
                publicUrl = storageService.uploadPdf(Files.readAllBytes(tempFile.toPath()), finalFilename);
            }

            return ResponseEntity.ok(Map.of(
                "message", "성공",
                "pdfUrl", "/api/invoices/exports/" + finalFilename,
                "publicUrl", publicUrl,
                "parsedText", parsedText
            ));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "처리 실패", "detail", e.getMessage()));
        } finally {
            if (tempFile != null) tempFile.delete();
            if (outputFile != null) outputFile.delete();
        }
    }

    @PostMapping("/upload-multiple")
    public ResponseEntity<?> uploadMultiple(@RequestPart("invoices") MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "업로드할 파일이 없습니다."));
        }

        List<Map<String, String>> results = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            File tempFile = null;
            File outputFile = null;
            try {
                String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "invoice.pdf";

                tempFile = File.createTempFile("invoice_", ".pdf");
                Files.copy(file.getInputStream(), tempFile.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);

                String parsedText = PdfUtil.parseAndDedupeText(tempFile);
                String hospitalName = PdfUtil.extractHospitalName(parsedText, originalName);
                String orderDate = PdfUtil.extractOrderDate(parsedText);

                String safeHosp = hospitalName.replaceAll("[^가-힣a-zA-Z0-9_-]", "");
                String finalFilename = safeHosp + "_" + orderDate + "_" + System.currentTimeMillis() + ".pdf";

                outputFile = File.createTempFile("output_", ".pdf");
                String publicUrl;
                try {
                    String templatePath = Objects.requireNonNull(
                        getClass().getClassLoader().getResource("templates/거래명세서_양식.pdf")
                    ).getPath();
                    PdfUtil.overlayTemplate(templatePath, tempFile.getAbsolutePath(), outputFile.getAbsolutePath());
                    publicUrl = storageService.uploadPdf(Files.readAllBytes(outputFile.toPath()), finalFilename);
                } catch (Exception e) {
                    publicUrl = storageService.uploadPdf(Files.readAllBytes(tempFile.toPath()), finalFilename);
                }

                Map<String, String> result = new HashMap<>();
                result.put("originalName", originalName);
                result.put("pdfUrl", "/api/invoices/exports/" + finalFilename);
                result.put("publicUrl", publicUrl);
                result.put("parsedText", parsedText);
                result.put("pdfFileName", finalFilename);
                results.add(result);

            } catch (IOException ex) {
                // 개별 파일 실패는 건너뛰고 계속 처리
            } finally {
                if (tempFile != null) tempFile.delete();
                if (outputFile != null) outputFile.delete();
            }
        }

        return ResponseEntity.ok(Map.of("message", "다중 업로드 완료", "files", results));
    }
}

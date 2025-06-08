// src/main/java/com/onliner/medicine_server/controller/InvoiceController.java
package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.util.PdfUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @GetMapping("/exports/{filename:.+}")
    public ResponseEntity<Resource> downloadPdf(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("C:/Users/USER/Desktop/react/onliner/medicine-server/exports").resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @Value("${spring.servlet.multipart.location}")
    private String uploadDir;

    private final Path exportsPath = Paths.get("C:/Users/USER/Desktop/react/onliner/medicine-server/exports");

    @PostMapping("/upload")
    public ResponseEntity<?> uploadSingle(@RequestPart("invoice") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "업로드할 PDF 파일이 없습니다."));
        }

        try {
            String originalName = Objects.requireNonNull(file.getOriginalFilename());
            Path tempDir = Paths.get(uploadDir);
            if (Files.notExists(tempDir)) {
                Files.createDirectories(tempDir);
            }
            String tempFilename = UUID.randomUUID() + "_" + originalName;
            Path tempFilePath = tempDir.resolve(tempFilename);
            Files.copy(file.getInputStream(), tempFilePath, StandardCopyOption.REPLACE_EXISTING);

            String parsedText = PdfUtil.parseAndDedupeText(tempFilePath.toFile());
            String hospitalName = PdfUtil.extractHospitalName(parsedText, originalName);
            String orderDate = PdfUtil.extractOrderDate(parsedText);

            String safeHosp = hospitalName.replaceAll("[^가-힣a-zA-Z0-9_-]", "");
            String safeDate = orderDate;
            String finalFilename = safeHosp + "_" + safeDate + ".pdf";

            if (Files.notExists(exportsPath)) {
                Files.createDirectories(exportsPath);
            }
            Path finalPdfPath = exportsPath.resolve(finalFilename);

            String templateAbsolutePath = Paths.get("src/main/resources/templates/거래명세서_양식.pdf").toString();
            PdfUtil.overlayTemplate(templateAbsolutePath, tempFilePath.toString(), finalPdfPath.toString());

            Files.deleteIfExists(tempFilePath);

            String pdfUrl = "/exports/" + finalFilename;
            Map<String, Object> body = new HashMap<>();
            body.put("message", "성공");
            body.put("pdfUrl", pdfUrl);
            body.put("parsedText", parsedText);

            return ResponseEntity.ok(body);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "처리 실패", "detail", e.getMessage()));
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
            try {
                String originalName = Objects.requireNonNull(file.getOriginalFilename());
                Path tempDir = Paths.get(uploadDir);
                if (Files.notExists(tempDir)) {
                    Files.createDirectories(tempDir);
                }
                String tempFilename = UUID.randomUUID() + "_" + originalName;
                Path tempFilePath = tempDir.resolve(tempFilename);
                Files.copy(file.getInputStream(), tempFilePath, StandardCopyOption.REPLACE_EXISTING);

                String parsedText = PdfUtil.parseAndDedupeText(tempFilePath.toFile());
                String hospitalName = PdfUtil.extractHospitalName(parsedText, originalName);
                String orderDate = PdfUtil.extractOrderDate(parsedText);

                String safeHosp = hospitalName.replaceAll("[^가-힣a-zA-Z0-9_-]", "");
                String safeDate = orderDate;
                String finalFilename = safeHosp + "_" + safeDate + "_" + System.currentTimeMillis() + ".pdf";

                if (Files.notExists(exportsPath)) {
                    Files.createDirectories(exportsPath);
                }
                Path finalPdfPath = exportsPath.resolve(finalFilename);

                String templateAbsolutePath = Paths.get("src/main/resources/templates/거래명세서_양식.pdf").toString();
                PdfUtil.overlayTemplate(templateAbsolutePath, tempFilePath.toString(), finalPdfPath.toString());

                Files.deleteIfExists(tempFilePath);

                Map<String, String> singleResult = new HashMap<>();
                singleResult.put("originalName", originalName);
                singleResult.put("pdfUrl", "/exports/" + finalFilename);
                singleResult.put("parsedText", parsedText);
                singleResult.put("pdfFileName", finalFilename); // ✅ 추가
                results.add(singleResult);

            } catch (IOException ex) {
                ex.printStackTrace();
            }
        }

        return ResponseEntity.ok(Map.of("message", "다중 업로드 완료", "files", results));
    }
}

// src/main/java/com/onliner/medicine_server/controller/InvoiceController.java
package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.util.PdfUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.FileSystemUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    // application.properties 에 설정된 업로드/exports 디렉토리 경로
    @Value("${spring.servlet.multipart.location}")
    private String uploadDir; // 예: "uploads"

    @Value("${spring.mvc.static-path-pattern}")
    private String exportsStaticPattern; // 예: "/exports/**"
    @Value("${spring.resources.static-locations}")
    private String exportsStaticLocation; // 예: "file:exports/"

    // 실제 파일시스템 상 exports 폴더 경로 (spring.resources.static-locations 에서 "file:exports/" 떼어낸 부분)
    private final Path exportsPath = Paths.get("exports");

    // ─── 단일 파일 업로드 & 병합 ─────────────────────────────────────────────────
    @PostMapping("/upload")
    public ResponseEntity<?> uploadSingle(@RequestPart("invoice") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "업로드할 PDF 파일이 없습니다."));
        }

        try {
            // 1) 업로드된 파일을 임시 디렉토리에 저장
            String originalName = Objects.requireNonNull(file.getOriginalFilename());
            Path tempDir = Paths.get(uploadDir);
            if (Files.notExists(tempDir)) {
                Files.createDirectories(tempDir);
            }
            String tempFilename = UUID.randomUUID() + "_" + originalName;
            Path tempFilePath = tempDir.resolve(tempFilename);
            Files.copy(file.getInputStream(), tempFilePath, StandardCopyOption.REPLACE_EXISTING);

            // 2) PDF 파싱 + 중복 제거
            String parsedText = PdfUtil.parseAndDedupeText(tempFilePath.toFile());

            // 3) 병원명, 주문날짜 추출
            String hospitalName = PdfUtil.extractHospitalName(parsedText, originalName);
            String orderDate    = PdfUtil.extractOrderDate(parsedText);

            // 4) 안전한 파일명 생성
            String safeHosp = hospitalName.replaceAll("[^가-힣a-zA-Z0-9_-]", "");
            String safeDate = orderDate;
            String finalFilename = safeHosp + "_" + safeDate + ".pdf";

            // 5) exports 디렉토리 생성
            if (Files.notExists(exportsPath)) {
                Files.createDirectories(exportsPath);
            }
            Path finalPdfPath = exportsPath.resolve(finalFilename);

            // 6) 템플릿 병합
            //    resources/templates/거래명세서_양식.pdf 경로 얻기
            String templateAbsolutePath = Paths.get("src/main/resources/templates/거래명세서_양식.pdf").toString();
            PdfUtil.mergeWithTemplate(templateAbsolutePath, tempFilePath.toString(), finalPdfPath.toString());

            // 7) 임시 업로드 파일 삭제 (원한다면)
            Files.deleteIfExists(tempFilePath);

            // 8) 응답: JSON { message, pdfUrl, parsedText }
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

    // ─── 다중 파일 업로드 & 병합 ─────────────────────────────────────────────────
    @PostMapping("/upload-multiple")
    public ResponseEntity<?> uploadMultiple(@RequestPart("invoices") MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "업로드할 파일이 없습니다."));
        }

        List<Map<String, String>> results = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            try {
                // (A) 임시 저장
                String originalName = Objects.requireNonNull(file.getOriginalFilename());
                Path tempDir = Paths.get(uploadDir);
                if (Files.notExists(tempDir)) {
                    Files.createDirectories(tempDir);
                }
                String tempFilename = UUID.randomUUID() + "_" + originalName;
                Path tempFilePath = tempDir.resolve(tempFilename);
                Files.copy(file.getInputStream(), tempFilePath, StandardCopyOption.REPLACE_EXISTING);

                // (B) 파싱 + 중복 제거
                String parsedText = PdfUtil.parseAndDedupeText(tempFilePath.toFile());

                // (C) 병원명, 주문날짜 추출
                String hospitalName = PdfUtil.extractHospitalName(parsedText, originalName);
                String orderDate    = PdfUtil.extractOrderDate(parsedText);

                // (D) 파일명 생성 (타임스탬프 포함)
                String safeHosp = hospitalName.replaceAll("[^가-힣a-zA-Z0-9_-]", "");
                String safeDate = orderDate;
                String finalFilename = safeHosp + "_" + safeDate + "_" + System.currentTimeMillis() + ".pdf";

                // (E) exports 디렉토리 생성
                if (Files.notExists(exportsPath)) {
                    Files.createDirectories(exportsPath);
                }
                Path finalPdfPath = exportsPath.resolve(finalFilename);

                // (F) 템플릿 병합
                String templateAbsolutePath = Paths.get("src/main/resources/templates/거래명세서_양식.pdf").toString();
                PdfUtil.mergeWithTemplate(templateAbsolutePath, tempFilePath.toString(), finalPdfPath.toString());

                // (G) 임시 파일 삭제
                Files.deleteIfExists(tempFilePath);

                // (H) 결과 목록에 추가
                Map<String, String> singleResult = new HashMap<>();
                singleResult.put("originalName", originalName);
                singleResult.put("pdfUrl", "/exports/" + finalFilename);
                singleResult.put("parsedText", parsedText);
                results.add(singleResult);

            } catch (IOException ex) {
                ex.printStackTrace();
                // 오류가 난 파일은 skip 하고 계속 진행하거나, 전체 오류로 처리할 수 있습니다.
            }
        }

        // 응답: JSON { message, files: [ { originalName, pdfUrl, parsedText }, … ] }
        return ResponseEntity.ok(Map.of("message", "다중 업로드 완료", "files", results));
    }
}

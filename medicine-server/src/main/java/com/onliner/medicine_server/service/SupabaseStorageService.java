package com.onliner.medicine_server.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

@Service
public class SupabaseStorageService {

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key:}")
    private String serviceRoleKey;

    @Value("${supabase.storage.bucket:invoices}")
    private String bucket;

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorageService.class);

    private final RestTemplate restTemplate = new RestTemplate();

    public String uploadPdf(byte[] pdfBytes, String filename) {
        return upload(pdfBytes, filename, MediaType.APPLICATION_PDF);
    }

    public String uploadImage(byte[] imageBytes, String filename) {
        return upload(imageBytes, filename, MediaType.IMAGE_PNG);
    }

    public byte[] downloadFile(String filename) {
        if (supabaseUrl == null || supabaseUrl.isBlank() || serviceRoleKey == null || serviceRoleKey.isBlank()) {
            throw new IllegalStateException("Supabase 설정이 완료되지 않았습니다. (supabase.url 또는 supabase.service-role-key 누락)");
        }

        String downloadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + filename;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            HttpMethod method = java.util.Objects.requireNonNull(HttpMethod.GET);
            ResponseEntity<byte[]> response = restTemplate.exchange(downloadUrl, method, entity, byte[].class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("Supabase 다운로드 실패 (HTTP " + response.getStatusCode() + "): " + filename);
            }
            return response.getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("Supabase 다운로드 실패 [{}]: HTTP {} - {}", filename, e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("파일 다운로드 실패: " + e.getMessage(), e);
        }
    }

    private String upload(byte[] bytes, String filename, MediaType contentType) {
        if (supabaseUrl == null || supabaseUrl.isBlank() || serviceRoleKey == null || serviceRoleKey.isBlank()) {
            throw new IllegalStateException("Supabase 설정이 완료되지 않았습니다. (supabase.url 또는 supabase.service-role-key 누락)");
        }

        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + filename;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.setContentType(contentType);
        headers.set("x-upsert", "true");

        HttpEntity<byte[]> entity = new HttpEntity<>(bytes, headers);
        try {
            ResponseEntity<Void> response = restTemplate.postForEntity(uploadUrl, entity, Void.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Supabase 업로드 실패 (HTTP " + response.getStatusCode() + "): " + filename);
            }
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("Supabase 업로드 실패 [{}]: HTTP {} - {}", filename, e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("파일 업로드 실패: " + e.getMessage(), e);
        }

        return getPublicUrl(filename);
    }

    public String getPublicUrl(String filename) {
        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + filename;
    }
}

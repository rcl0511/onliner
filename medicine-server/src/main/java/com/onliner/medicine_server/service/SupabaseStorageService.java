package com.onliner.medicine_server.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @Value("${supabase.storage.bucket:invoices}")
    private String bucket;

    private final RestTemplate restTemplate = new RestTemplate();

    public String uploadPdf(byte[] pdfBytes, String filename) {
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + filename;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set("x-upsert", "true");

        HttpEntity<byte[]> entity = new HttpEntity<>(pdfBytes, headers);
        restTemplate.postForEntity(uploadUrl, entity, Void.class);

        return getPublicUrl(filename);
    }

    public String getPublicUrl(String filename) {
        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + filename;
    }
}

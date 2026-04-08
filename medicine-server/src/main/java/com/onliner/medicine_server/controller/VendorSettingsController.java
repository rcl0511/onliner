package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.VendorSettings;
import com.onliner.medicine_server.repository.VendorSettingsRepository;
import io.jsonwebtoken.Claims;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.context.annotation.Profile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Profile("!render-nodb")
@RestController
@RequestMapping("/api/vendors")
public class VendorSettingsController {

    private final VendorSettingsRepository vendorSettingsRepository;

    @Value("${file.upload.dir:./uploads}")
    private String uploadDirStr;

    private Path uploadPath;

    @PostConstruct
    public void init() throws IOException {
        uploadPath = Paths.get(uploadDirStr).toAbsolutePath();
        Files.createDirectories(uploadPath);
    }

    public VendorSettingsController(VendorSettingsRepository vendorSettingsRepository) {
        this.vendorSettingsRepository = vendorSettingsRepository;
    }

    @GetMapping("/{companyCode}/settings")
    public ResponseEntity<VendorSettings> getSettings(@PathVariable String companyCode, Authentication auth) {
        Claims claims = (Claims) auth.getDetails();
        String tokenCompanyCode = claims.get("companyCode", String.class);
        if (!companyCode.equals(tokenCompanyCode)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다.");
        }

        VendorSettings settings = vendorSettingsRepository.findById(Objects.requireNonNull(companyCode))
                .orElse(VendorSettings.builder().companyCode(companyCode).build());
        return ResponseEntity.ok(settings);
    }

    @PutMapping(value = "/{companyCode}/settings", consumes = "multipart/form-data")
    public ResponseEntity<VendorSettings> updateSettings(
            @PathVariable String companyCode,
            @RequestParam(required = false) String companyName,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String businessNumber,
            @RequestParam(required = false) String representative,
            @RequestPart(required = false) MultipartFile logo,
            @RequestPart(required = false) MultipartFile seal,
            Authentication auth) throws IOException {

        Claims claims = (Claims) auth.getDetails();
        String tokenCompanyCode = claims.get("companyCode", String.class);
        String permission = claims.get("permission", String.class);

        if (!companyCode.equals(tokenCompanyCode)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다.");
        }
        if (!"MASTER".equals(permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MASTER 권한이 필요합니다.");
        }

        VendorSettings settings = vendorSettingsRepository.findById(Objects.requireNonNull(companyCode))
                .orElse(VendorSettings.builder().companyCode(companyCode).build());

        if (companyName != null) settings.setCompanyName(companyName);
        if (address != null) settings.setAddress(address);
        if (phone != null) settings.setPhone(phone);
        if (email != null) settings.setEmail(email);
        if (businessNumber != null) settings.setBusinessNumber(businessNumber);
        if (representative != null) settings.setRepresentative(representative);

        if (logo != null && !logo.isEmpty()) {
            String filename = "logo_" + companyCode + "_" + UUID.randomUUID() + getExtension(logo.getOriginalFilename());
            Files.copy(logo.getInputStream(), uploadPath.resolve(filename), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            settings.setLogoPath("/uploads/" + filename);
        }
        if (seal != null && !seal.isEmpty()) {
            String filename = "seal_" + companyCode + "_" + UUID.randomUUID() + getExtension(seal.getOriginalFilename());
            Files.copy(seal.getInputStream(), uploadPath.resolve(filename), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            settings.setSealPath("/uploads/" + filename);
        }

        vendorSettingsRepository.save(Objects.requireNonNull(settings));
        return ResponseEntity.ok(settings);
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}

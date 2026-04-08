package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.entity.User;
import com.onliner.medicine_server.entity.VendorUser;
import com.onliner.medicine_server.repository.UserRepository;
import com.onliner.medicine_server.repository.VendorUserRepository;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Profile("!render-nodb")
@RestController
@RequestMapping("/api/users")
public class UserManagementController {

    private final UserRepository userRepository;
    private final VendorUserRepository vendorUserRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementController(UserRepository userRepository,
                                     VendorUserRepository vendorUserRepository,
                                     PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.vendorUserRepository = vendorUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 업체 내 사용자 목록 조회 (MASTER만 가능)
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUsers(Authentication auth) {
        Claims claims = requireClaims(auth);
        String companyCode = claims.get("companyCode", String.class);
        String permission = claims.get("permission", String.class);

        if (!"MASTER".equals(permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MASTER 권한이 필요합니다.");
        }

        List<VendorUser> vendorUsers = vendorUserRepository.findByCompanyCode(companyCode);
        List<Map<String, Object>> result = vendorUsers.stream().map(vu -> Map.<String, Object>of(
                "id", vu.getUser().getId(),
                "name", vu.getUser().getName(),
                "identifier", vu.getUser().getIdentifier(),
                "permission", vu.getPermission(),
                "active", vu.getUser().isActive()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // 신규 계정 생성 (MASTER만 가능)
    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, String> body, Authentication auth) {
        Claims claims = requireClaims(auth);
        String companyCode = claims.get("companyCode", String.class);
        String permission = claims.get("permission", String.class);
        String companyName = claims.get("companyName", String.class);

        if (!"MASTER".equals(permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MASTER 권한이 필요합니다.");
        }

        String email = body.get("email");
        String name = body.get("name");
        String rawPassword = body.get("password");
        String newPermission = body.get("permission");

        if (email == null || name == null || rawPassword == null || newPermission == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email, name, password, permission 필수입니다.");
        }
        if (userRepository.existsByIdentifier(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 이메일입니다.");
        }

        User user = new User();
        user.setIdentifier(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole("vendor");
        user.setName(name);
        user.setActive(true);
        user.setRequiresPasswordChange(true);
        User savedUser = Objects.requireNonNull(userRepository.save(user));

        VendorUser vendorUser = new VendorUser();
        vendorUser.setUser(savedUser);
        vendorUser.setCompanyCode(companyCode);
        vendorUser.setCompanyName(companyName != null ? companyName : "");
        vendorUser.setPermission(newPermission);
        VendorUser savedVendorUser = Objects.requireNonNull(vendorUserRepository.save(vendorUser));

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", savedUser.getId(),
                "name", savedUser.getName(),
                "identifier", savedUser.getIdentifier(),
                "permission", savedVendorUser.getPermission()
        ));
    }

    // 계정 수정 (MASTER만 가능)
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id,
                                                           @RequestBody Map<String, String> body,
                                                           Authentication auth) {
        Claims claims = requireClaims(auth);
        String permission = claims.get("permission", String.class);
        String companyCode = claims.get("companyCode", String.class);

        if (!"MASTER".equals(permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MASTER 권한이 필요합니다.");
        }

        User user = userRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

        VendorUser vendorUser = vendorUserRepository.findByUser(user)
                .filter(vu -> companyCode.equals(vu.getCompanyCode()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다."));

        if (body.containsKey("name")) user.setName(body.get("name"));
        if (body.containsKey("active")) user.setActive(Boolean.parseBoolean(body.get("active")));
        if (body.containsKey("permission")) vendorUser.setPermission(body.get("permission"));

        userRepository.save(Objects.requireNonNull(user));
        vendorUserRepository.save(Objects.requireNonNull(vendorUser));

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "permission", vendorUser.getPermission(),
                "active", user.isActive()
        ));
    }

    // 계정 삭제 (비활성화) - MASTER만 가능
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication auth) {
        Claims claims = requireClaims(auth);
        String permission = claims.get("permission", String.class);
        String companyCode = claims.get("companyCode", String.class);

        if (!"MASTER".equals(permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MASTER 권한이 필요합니다.");
        }

        User user = userRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

        vendorUserRepository.findByUser(user)
                .filter(vu -> companyCode.equals(vu.getCompanyCode()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다."));

        user.setActive(false);
        userRepository.save(Objects.requireNonNull(user));

        return ResponseEntity.noContent().build();
    }

    // 비밀번호 변경 (본인만 가능)
    @PutMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(@PathVariable Long id,
                                                @RequestBody Map<String, String> body,
                                                Authentication auth) {
        String currentUserIdentifier = (String) auth.getPrincipal();

        User user = userRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

        if (!user.getIdentifier().equals(currentUserIdentifier)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 비밀번호만 변경할 수 있습니다.");
        }

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "currentPassword, newPassword 필수입니다.");
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "현재 비밀번호가 잘못되었습니다.");
        }
        if (newPassword.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호는 6자 이상이어야 합니다.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setRequiresPasswordChange(false);
        userRepository.save(Objects.requireNonNull(user));

        return ResponseEntity.noContent().build();
    }

    @Nullable
    private Claims extractClaims(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Claims claims) {
            return claims;
        }
        return null;
    }

    private Claims requireClaims(Authentication auth) {
        Claims claims = extractClaims(auth);
        if (claims == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보가 없습니다.");
        }
        return claims;
    }
}

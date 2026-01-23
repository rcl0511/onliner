package com.onliner.medicine_server.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class AuthService {
    private final boolean devBypass;

    public AuthService(@Value("${auth.dev-bypass:false}") boolean devBypass) {
        this.devBypass = devBypass;
    }

    private static final Map<String, HospitalAccount> HOSPITAL_ACCOUNTS = Map.of(
            "01012345678", new HospitalAccount("temp1234", true, "서울대학교병원", "hospital-snu"),
            "01087654321", new HospitalAccount("temp1234", false, "서울대학교병원", "hospital-snu")
    );

    private static final Map<String, Map<String, VendorAccount>> VENDOR_ACCOUNTS = Map.of(
            "dh-pharm", Map.of(
                    "master@dh-pharm.com", new VendorAccount("1234", "MASTER", "대표 관리자", "DH약품"),
                    "sales@dh-pharm.com", new VendorAccount("1234", "SALES", "영업 담당", "DH약품"),
                    "warehouse@dh-pharm.com", new VendorAccount("1234", "WAREHOUSE", "창고 관리자", "DH약품")
            ),
            "test-company", Map.of(
                    "master@test.com", new VendorAccount("1234", "MASTER", "대표 관리자", "테스트업체")
            )
    );

    public LoginResponse login(LoginRequest request, JwtService jwtService) {
        if (request == null || request.role() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role is required");
        }
        String role = request.role().trim().toLowerCase();
        if (devBypass) {
            return loginBypass(role, request, jwtService);
        }
        return switch (role) {
            case "hospital" -> loginHospital(request, jwtService);
            case "vendor" -> loginVendor(request, jwtService);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid role");
        };
    }

    private LoginResponse loginHospital(LoginRequest request, JwtService jwtService) {
        if (request.phone() == null || request.password() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "phone/password required");
        }
        HospitalAccount account = HOSPITAL_ACCOUNTS.get(request.phone());
        if (account == null || !account.password().equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "전화번호 또는 비밀번호가 잘못되었습니다.");
        }
        UserInfo user = new UserInfo(
                "hospital",
                "병원 담당자",
                null,
                null,
                null,
                account.hospitalName(),
                account.hospitalId(),
                request.phone(),
                null,
                account.requiresPasswordChange()
        );
        String token = jwtService.generateToken(user);
        return new LoginResponse(token, user);
    }

    private LoginResponse loginVendor(LoginRequest request, JwtService jwtService) {
        if (request.companyCode() == null || request.email() == null || request.password() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "companyCode/email/password required");
        }
        String code = request.companyCode().trim().toLowerCase();
        Map<String, VendorAccount> companyAccounts = VENDOR_ACCOUNTS.get(code);
        if (companyAccounts == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "등록되지 않은 업체 코드입니다.");
        }
        VendorAccount account = companyAccounts.get(request.email());
        if (account == null || !account.password().equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 잘못되었습니다.");
        }
        UserInfo user = new UserInfo(
                "vendor",
                account.name(),
                code,
                account.companyName(),
                account.permission(),
                null,
                null,
                null,
                request.email(),
                false
        );
        String token = jwtService.generateToken(user);
        return new LoginResponse(token, user);
    }

    private LoginResponse loginBypass(String role, LoginRequest request, JwtService jwtService) {
        return switch (role) {
            case "hospital" -> {
                String phone = request.phone() == null ? "00000000000" : request.phone();
                UserInfo user = new UserInfo(
                        "hospital",
                        "병원 담당자",
                        null,
                        null,
                        null,
                        "테스트병원",
                        "hospital-dev",
                        phone,
                        null,
                        false
                );
                String token = jwtService.generateToken(user);
                yield new LoginResponse(token, user);
            }
            case "vendor" -> {
                String companyCode = request.companyCode() == null ? "dh-pharm" : request.companyCode().trim().toLowerCase();
                String email = request.email() == null ? "dev@local" : request.email();
                UserInfo user = new UserInfo(
                        "vendor",
                        "도매 담당자",
                        companyCode,
                        "테스트업체",
                        "MASTER",
                        null,
                        null,
                        null,
                        email,
                        false
                );
                String token = jwtService.generateToken(user);
                yield new LoginResponse(token, user);
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid role");
        };
    }

    private record HospitalAccount(String password, boolean requiresPasswordChange, String hospitalName, String hospitalId) {
    }

    private record VendorAccount(String password, String permission, String name, String companyName) {
    }
}

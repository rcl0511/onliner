package com.onliner.medicine_server.auth;

import com.onliner.medicine_server.entity.HospitalUser;
import com.onliner.medicine_server.entity.User;
import com.onliner.medicine_server.entity.VendorUser;
import com.onliner.medicine_server.repository.HospitalUserRepository;
import com.onliner.medicine_server.repository.UserRepository;
import com.onliner.medicine_server.repository.VendorUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class AuthService {

    // render-nodb 프로파일에서는 null일 수 있음
    @Nullable
    private final UserRepository userRepository;
    @Nullable
    private final VendorUserRepository vendorUserRepository;
    @Nullable
    private final HospitalUserRepository hospitalUserRepository;
    @Nullable
    private final PasswordEncoder passwordEncoder;

    // DB 없는 환경을 위한 폴백 계정 (render-nodb 전용)
    private static final Map<String, String[]> FALLBACK_HOSPITAL = Map.of(
            "01012345678", new String[]{"temp1234", "서울대학교병원", "hospital-snu", "병원 담당자"}
    );
    private static final Map<String, Map<String, String[]>> FALLBACK_VENDOR = Map.of(
            "dh-pharm", Map.of(
                    "master@dh-pharm.com", new String[]{"1234", "MASTER", "대표 관리자", "DH약품"},
                    "sales@dh-pharm.com", new String[]{"1234", "SALES", "영업 담당", "DH약품"},
                    "warehouse@dh-pharm.com", new String[]{"1234", "WAREHOUSE", "창고 관리자", "DH약품"}
            )
    );

    @Autowired
    public AuthService(@Nullable UserRepository userRepository,
                       @Nullable VendorUserRepository vendorUserRepository,
                       @Nullable HospitalUserRepository hospitalUserRepository,
                       @Nullable PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.vendorUserRepository = vendorUserRepository;
        this.hospitalUserRepository = hospitalUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request, JwtService jwtService) {
        if (request == null || request.role() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role is required");
        }
        String role = request.role().trim().toLowerCase();
        // DB 사용 불가 시 폴백 로그인
        if (userRepository == null) {
            return switch (role) {
                case "hospital" -> loginHospitalFallback(request, jwtService);
                case "vendor" -> loginVendorFallback(request, jwtService);
                default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid role");
            };
        }
        return switch (role) {
            case "hospital" -> loginHospital(request, jwtService);
            case "vendor" -> loginVendor(request, jwtService);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid role");
        };
    }

    private LoginResponse loginHospitalFallback(LoginRequest request, JwtService jwtService) {
        if (request.phone() == null || request.password() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "phone/password required");
        }
        String[] account = FALLBACK_HOSPITAL.get(request.phone());
        if (account == null || !account[0].equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "전화번호 또는 비밀번호가 잘못되었습니다.");
        }
        UserInfo user = new UserInfo("hospital", account[3], null, null, null, account[1], account[2], request.phone(), null, false);
        return new LoginResponse(jwtService.generateToken(user), user);
    }

    private LoginResponse loginVendorFallback(LoginRequest request, JwtService jwtService) {
        if (request.companyCode() == null || request.email() == null || request.password() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "companyCode/email/password required");
        }
        String code = request.companyCode().trim().toLowerCase();
        Map<String, String[]> companyAccounts = FALLBACK_VENDOR.get(code);
        if (companyAccounts == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "등록되지 않은 업체 코드입니다.");
        }
        String[] account = companyAccounts.get(request.email());
        if (account == null || !account[0].equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 잘못되었습니다.");
        }
        UserInfo user = new UserInfo("vendor", account[2], code, account[3], account[1], null, null, null, request.email(), false);
        return new LoginResponse(jwtService.generateToken(user), user);
    }

    private LoginResponse loginHospital(LoginRequest request, JwtService jwtService) {
        if (request.phone() == null || request.password() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "phone/password required");
        }
        if (userRepository == null || passwordEncoder == null || hospitalUserRepository == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "DB 연결 없음");
        }

        User user = userRepository.findByIdentifier(request.phone())
                .filter(u -> "hospital".equals(u.getRole()) && u.isActive())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "전화번호 또는 비밀번호가 잘못되었습니다."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "전화번호 또는 비밀번호가 잘못되었습니다.");
        }

        HospitalUser hospitalUser = hospitalUserRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "병원 정보를 찾을 수 없습니다."));

        UserInfo userInfo = new UserInfo(
                "hospital",
                user.getName(),
                null,
                null,
                null,
                hospitalUser.getHospitalName(),
                hospitalUser.getHospitalId(),
                request.phone(),
                null,
                user.isRequiresPasswordChange()
        );
        String token = jwtService.generateToken(userInfo);
        return new LoginResponse(token, userInfo);
    }

    private LoginResponse loginVendor(LoginRequest request, JwtService jwtService) {
        if (request.companyCode() == null || request.email() == null || request.password() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "companyCode/email/password required");
        }
        if (userRepository == null || passwordEncoder == null || vendorUserRepository == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "DB 연결 없음");
        }

        String email = request.email().trim();
        User user = userRepository.findByIdentifier(email)
                .filter(u -> "vendor".equals(u.getRole()) && u.isActive())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 잘못되었습니다."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 잘못되었습니다.");
        }

        VendorUser vendorUser = vendorUserRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "업체 정보를 찾을 수 없습니다."));

        String code = request.companyCode().trim().toLowerCase();
        if (!code.equals(vendorUser.getCompanyCode())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "등록되지 않은 업체 코드입니다.");
        }

        UserInfo userInfo = new UserInfo(
                "vendor",
                user.getName(),
                vendorUser.getCompanyCode(),
                vendorUser.getCompanyName(),
                vendorUser.getPermission(),
                null,
                null,
                null,
                email,
                false
        );
        String token = jwtService.generateToken(userInfo);
        return new LoginResponse(token, userInfo);
    }
}

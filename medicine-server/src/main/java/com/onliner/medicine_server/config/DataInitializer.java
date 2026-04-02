// src/main/java/com/onliner/medicine_server/config/DataInitializer.java
package com.onliner.medicine_server.config;

import com.onliner.medicine_server.entity.*;
import com.onliner.medicine_server.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("!render-nodb")
public class DataInitializer {

    @Bean
    CommandLineRunner runner(
            DriverRepository driverRepository,
            UserRepository userRepository,
            VendorUserRepository vendorUserRepository,
            HospitalUserRepository hospitalUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            // 배송 기사 초기 데이터
            if (!driverRepository.existsById("driver1")) {
                driverRepository.save(new Driver("driver1", "홍길동"));
            }
            if (!driverRepository.existsById("driver2")) {
                driverRepository.save(new Driver("driver2", "김철수"));
            }
            if (!driverRepository.existsById("driver3")) {
                driverRepository.save(new Driver("driver3", "이영희"));
            }

            // ============================================================
            // 업체(Vendor) 계정 초기 데이터 - dh-pharm
            // ============================================================
            createVendorUser(userRepository, vendorUserRepository, passwordEncoder,
                    "master@dh-pharm.com", "1234", "대표 관리자", "dh-pharm", "DH약품", "MASTER");
            createVendorUser(userRepository, vendorUserRepository, passwordEncoder,
                    "sales@dh-pharm.com", "1234", "영업 담당", "dh-pharm", "DH약품", "SALES");
            createVendorUser(userRepository, vendorUserRepository, passwordEncoder,
                    "warehouse@dh-pharm.com", "1234", "창고 관리자", "dh-pharm", "DH약품", "WAREHOUSE");

            // 테스트 업체
            createVendorUser(userRepository, vendorUserRepository, passwordEncoder,
                    "master@test.com", "1234", "대표 관리자", "test-company", "테스트업체", "MASTER");

            // ============================================================
            // 병원(Hospital) 계정 초기 데이터
            // ============================================================
            createHospitalUser(userRepository, hospitalUserRepository, passwordEncoder,
                    "01012345678", "temp1234", "병원 담당자", "서울대학교병원", "hospital-snu", true);
            createHospitalUser(userRepository, hospitalUserRepository, passwordEncoder,
                    "01087654321", "temp1234", "병원 담당자2", "서울대학교병원", "hospital-snu", false);
        };
    }

    private void createVendorUser(
            UserRepository userRepository,
            VendorUserRepository vendorUserRepository,
            PasswordEncoder passwordEncoder,
            String email, String rawPassword, String name,
            String companyCode, String companyName, String permission
    ) {
        if (userRepository.existsByIdentifier(email)) return;

        User user = User.builder()
                .identifier(email)
                .password(passwordEncoder.encode(rawPassword))
                .role("vendor")
                .name(name)
                .active(true)
                .requiresPasswordChange(false)
                .build();
        userRepository.save(user);

        VendorUser vendorUser = VendorUser.builder()
                .user(user)
                .companyCode(companyCode)
                .companyName(companyName)
                .permission(permission)
                .build();
        vendorUserRepository.save(vendorUser);
    }

    private void createHospitalUser(
            UserRepository userRepository,
            HospitalUserRepository hospitalUserRepository,
            PasswordEncoder passwordEncoder,
            String phone, String rawPassword, String name,
            String hospitalName, String hospitalId, boolean requiresPasswordChange
    ) {
        if (userRepository.existsByIdentifier(phone)) return;

        User user = User.builder()
                .identifier(phone)
                .password(passwordEncoder.encode(rawPassword))
                .role("hospital")
                .name(name)
                .active(true)
                .requiresPasswordChange(requiresPasswordChange)
                .build();
        userRepository.save(user);

        HospitalUser hospitalUser = HospitalUser.builder()
                .user(user)
                .hospitalName(hospitalName)
                .hospitalId(hospitalId)
                .build();
        hospitalUserRepository.save(hospitalUser);
    }
}

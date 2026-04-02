package com.onliner.medicine_server.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vendor_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorSettings {

    @Id
    @Column(nullable = false, unique = true, length = 50)
    private String companyCode;

    @Column(length = 100)
    private String companyName;

    @Column(length = 200)
    private String address;

    @Column(length = 30)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 30)
    private String businessNumber;

    @Column(length = 50)
    private String representative;

    // 파일 경로 (서버 내 저장 경로)
    @Column(length = 300)
    private String logoPath;

    @Column(length = 300)
    private String sealPath;
}

// src/main/java/com/onliner/medicine_server/entity/VendorClient.java
package com.onliner.medicine_server.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "vendor_clients")
@Data
public class VendorClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String classification;   // 거래처 구분

    @Column(unique = true, nullable = false)
    private String code;             // 코드 (고유)

    private String nameInternal;     // 상호내부명
    private String nameOriginal;     // 사업자원어명
    private String representative;   // 대표자

    private LocalDate dob;           // 생년월일 (YYYY-MM-DD)

    private String businessNumber;   // 사업자번호
    private String phone;            // 전화번호
    private String fax;              // 팩스번호
    private String zip;              // 우편번호
    private String address;          // 사업장주소

    private String salesRep;         // 영업담당
    private String deptHead;         // 부서장
    private String priceApply;       // 단가적용처
    private String stockApply;       // 재고적용처

    private Boolean invoiceIssue;    // 계산서발행
    private String businessType;     // 업태
    private String item;             // 종목
    private String clientType;       // 거래처종류
    private String clientGroup;      // 거래처그룹
    private String contractType;     // 계약구분
    private String deliveryType;     // 배송구분

    private String pharmacist;       // 약사성함
    private String licenseNo;        // 면허번호
    private String careNo;           // 요양기관번호
    private String narcoticsId;      // 마약류취급자식별번호
    private String deviceClient;     // 의료기기거래처코드

    private String contact;          // 거래처담당자
    private String email;            // 이메일
    private String invoiceManager;   // 계산서담당자
    private String managerPhone;     // 담당자핸드폰

    private Double creditLimit;      // 여신한도
    private Integer maxTurnDays;     // 최대회전일
    private Integer monthlyEstimate; // 월결재예상일

    private LocalDate startDate;     // 거래개시일 (YYYY-MM-DD)

    private String note1;            // 비고1
    private String note2;            // 비고2

    private Boolean active;          // 거래여부
    private Boolean eInvoice;        // 전자거래명세서
    private String invoiceSystem;    // 명세서전송시스템
    private Boolean externalExclude; // 외부연동제외
    private Boolean prePayment;      // 선결제유무

    public VendorClient() {
        // 기본 생성자
    }
}

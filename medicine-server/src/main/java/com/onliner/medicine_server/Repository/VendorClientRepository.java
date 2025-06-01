// src/main/java/com/onliner/medicine_server/repository/VendorClientRepository.java
package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.VendorClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorClientRepository extends JpaRepository<VendorClient, Long> {

    // 코드(부분 검색, 대소문자 무시)
    List<VendorClient> findByCodeContainingIgnoreCase(String code);

    // 사업자원어명(부분 검색, 대소문자 무시)
    List<VendorClient> findByNameOriginalContainingIgnoreCase(String nameOriginal);

    // 사업자번호(부분 검색)
    List<VendorClient> findByBusinessNumberContaining(String businessNumber);
}

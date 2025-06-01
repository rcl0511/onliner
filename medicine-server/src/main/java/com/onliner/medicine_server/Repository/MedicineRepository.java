// src/main/java/com/onliner/medicine_server/repository/MedicineRepository.java
package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    // 이름으로 조회 (Controller에서 검색 기능을 쓸 때)
    // List<Medicine> findByNameContainingIgnoreCase(String name);

    // 중복 검사용
    boolean existsByNo(Integer no);
    boolean existsByCode(String code);

    // 업데이트 로직에서 기존 엔티티 조회용
    Optional<Medicine> findByNo(Integer no);
    Optional<Medicine> findByCode(String code);
}

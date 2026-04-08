// src/main/java/com/onliner/medicine_server/repository/MedicineRepository.java
package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    // 이름으로 조회
    List<Medicine> findByNameContainingIgnoreCase(String name);

    // 중복 검사용
    boolean existsByNo(Integer no);
    boolean existsByCode(String code);

    // 업데이트 로직에서 기존 엔티티 조회용
    Optional<Medicine> findByNo(Integer no);
    Optional<Medicine> findByCode(String code);

    // 재고 임계치 이하 품목 조회 (stockQty가 threshold 미만)
    @Query("SELECT m FROM Medicine m WHERE m.stockQty IS NOT NULL AND m.stockQty <= :threshold ORDER BY m.stockQty ASC")
    List<Medicine> findLowStockItems(@Param("threshold") double threshold);
}

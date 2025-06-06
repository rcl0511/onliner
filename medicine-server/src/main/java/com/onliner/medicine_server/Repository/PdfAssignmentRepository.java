package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.PdfAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PdfAssignmentRepository extends JpaRepository<PdfAssignment, Long> {
    // 특정 기사 ID로 할당된 목록 조회
    List<PdfAssignment> findAllByDriverId(String driverId);

    // 중복 할당 방지를 위한 체크
    boolean existsByPdfKey(String pdfKey);
}

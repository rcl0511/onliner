package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByHospitalIdOrderByCreatedAtDesc(String hospitalId);
    Optional<Payment> findByOrderId(String orderId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.hospitalId = :hospitalId AND p.status = 'PAID'")
    BigDecimal sumPaidByHospitalId(@Param("hospitalId") String hospitalId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.hospitalId = :hospitalId AND p.status = 'PENDING'")
    BigDecimal sumPendingByHospitalId(@Param("hospitalId") String hospitalId);
}

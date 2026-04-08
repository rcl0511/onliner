package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.Signature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SignatureRepository extends JpaRepository<Signature, Long> {
    Optional<Signature> findByInvoiceId(String invoiceId);
    boolean existsByInvoiceId(String invoiceId);
}

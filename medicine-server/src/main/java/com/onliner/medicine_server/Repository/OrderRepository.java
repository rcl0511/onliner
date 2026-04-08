package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByVendorCodeOrderByCreatedAtDesc(String vendorCode);
    List<Order> findByHospitalIdOrderByCreatedAtDesc(String hospitalId);
}

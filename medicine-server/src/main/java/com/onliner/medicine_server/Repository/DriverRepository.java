package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverRepository extends JpaRepository<Driver, String> {
    // 기본 CRUD 메서드는 JpaRepository가 제공
}

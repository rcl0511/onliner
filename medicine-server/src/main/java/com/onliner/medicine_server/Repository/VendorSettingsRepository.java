package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.VendorSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VendorSettingsRepository extends JpaRepository<VendorSettings, String> {
}

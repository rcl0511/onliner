package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.User;
import com.onliner.medicine_server.entity.VendorUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorUserRepository extends JpaRepository<VendorUser, Long> {
    Optional<VendorUser> findByUser(User user);
    List<VendorUser> findByCompanyCode(String companyCode);
    boolean existsByCompanyCode(String companyCode);
}

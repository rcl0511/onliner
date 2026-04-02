package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.HospitalUser;
import com.onliner.medicine_server.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HospitalUserRepository extends JpaRepository<HospitalUser, Long> {
    Optional<HospitalUser> findByUser(User user);
    Optional<HospitalUser> findByHospitalId(String hospitalId);
}

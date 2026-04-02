package com.onliner.medicine_server.repository;

import com.onliner.medicine_server.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByIdentifier(String identifier);
    boolean existsByIdentifier(String identifier);
}

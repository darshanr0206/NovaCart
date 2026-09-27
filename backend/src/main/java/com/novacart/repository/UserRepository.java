package com.novacart.repository;

import com.novacart.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByResetPasswordToken(String token);
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);
}

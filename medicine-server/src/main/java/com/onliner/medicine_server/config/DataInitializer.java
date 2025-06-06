// src/main/java/com/onliner/medicine_server/config/DataInitializer.java
package com.onliner.medicine_server.config;

import com.onliner.medicine_server.entity.Driver;
import com.onliner.medicine_server.repository.DriverRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner runner(DriverRepository driverRepository) {
        return args -> {
            if (!driverRepository.existsById("driver1")) {
                driverRepository.save(new Driver("driver1", "홍길동"));
            }
            if (!driverRepository.existsById("driver2")) {
                driverRepository.save(new Driver("driver2", "김철수"));
            }
            if (!driverRepository.existsById("driver3")) {
                driverRepository.save(new Driver("driver3", "이영희"));
            }
        };
    }
}

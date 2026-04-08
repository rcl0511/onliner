package com.onliner.medicine_server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @Column(name = "id", length = 100)
    private String id; // ORDER-{timestamp}

    @Column(name = "vendor_code", length = 50)
    private String vendorCode;

    @Column(name = "vendor_name", length = 100)
    private String vendorName;

    @Column(name = "hospital_id", length = 100)
    private String hospitalId;

    @Column(name = "hospital_name", length = 200)
    private String hospitalName;

    @Column(name = "total_amount")
    private Long totalAmount;

    @Column(name = "status", length = 20)
    private String status; // PENDING, ACCEPTED, REJECTED

    @Column(name = "items", columnDefinition = "TEXT")
    private String items; // JSON array

    @Column(name = "created_at")
    private Instant createdAt;
}

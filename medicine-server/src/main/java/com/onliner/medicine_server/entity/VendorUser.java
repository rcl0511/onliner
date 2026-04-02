package com.onliner.medicine_server.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vendor_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 50)
    private String companyCode;

    @Column(nullable = false, length = 100)
    private String companyName;

    // MASTER, SALES, WAREHOUSE
    @Column(nullable = false, length = 20)
    private String permission;
}

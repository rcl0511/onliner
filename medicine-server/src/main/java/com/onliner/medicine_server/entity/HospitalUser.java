package com.onliner.medicine_server.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hospital_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HospitalUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 100)
    private String hospitalName;

    @Column(nullable = false, length = 50)
    private String hospitalId;
}

package com.onliner.medicine_server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "signatures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Signature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_id", nullable = false, length = 100)
    private String invoiceId;

    @Column(name = "hospital_id", length = 100)
    private String hospitalId;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON string

    @Column(name = "signed_at")
    private Instant signedAt;
}

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

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    /** Supabase 미설정 시 base64 PNG를 직접 저장하는 fallback 컬럼 */
    @Column(name = "image_data", columnDefinition = "LONGTEXT")
    private String imageData;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON string

    @Column(name = "signed_at")
    private Instant signedAt;
}

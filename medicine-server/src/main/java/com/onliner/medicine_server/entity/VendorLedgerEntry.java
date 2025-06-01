// src/main/java/com/onliner/medicine_server/entity/VendorLedgerEntry.java
package com.onliner.medicine_server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "vendor_ledger_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // "entry_date" 컬럼에 매핑, LocalDate 타입
    @Column(name = "entry_date", nullable = false)
    private LocalDate date;

    @Column(name = "order_id", nullable = false, length = 100)
    private String orderId;

    @Column(name = "qty", nullable = false)
    private Integer qty;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "remarks", length = 500)
    private String remarks;

    @Column(name = "hospital_id", nullable = false, length = 50)
    private String hospitalId;
}

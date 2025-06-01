// src/main/java/com/onliner/medicine_server/entity/Medicine.java
package com.onliner.medicine_server.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "medicines")
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 엑셀의 “No” 컬럼 (유니크 제약)
    @Column(nullable = false, unique = true)
    private Integer no;

    @Column(nullable = false)
    private String supplier;

    @Column(nullable = false)
    private String manufacturer;

    // 엑셀의 “코드” 컬럼 (유니크 제약)
    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String spec;
    private Double basePrice;
    private String location;
    private Double prevStock;
    private Double prevAmount;
    private Double inQty;
    private Double inAmount;
    private Double outQty;
    private Double outAmount;
    private Double stockQty;
    private Double purchasedQty;
    private Double unitPrice;
    private Double basePricePercent;
    private Double stockAmount;
    private String basePriceCode;
    private String remarks;
    private String standardCode;
    private String productLocation;

    // 기본 생성자 (JPA 사용 용도)
    public Medicine() {}

    // --- Getter / Setter ---
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }

    public Integer getNo() {
        return no;
    }
    public void setNo(Integer no) {
        this.no = no;
    }

    public String getSupplier() {
        return supplier;
    }
    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public String getManufacturer() {
        return manufacturer;
    }
    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getCode() {
        return code;
    }
    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public String getSpec() {
        return spec;
    }
    public void setSpec(String spec) {
        this.spec = spec;
    }

    public Double getBasePrice() {
        return basePrice;
    }
    public void setBasePrice(Double basePrice) {
        this.basePrice = basePrice;
    }

    public String getLocation() {
        return location;
    }
    public void setLocation(String location) {
        this.location = location;
    }

    public Double getPrevStock() {
        return prevStock;
    }
    public void setPrevStock(Double prevStock) {
        this.prevStock = prevStock;
    }

    public Double getPrevAmount() {
        return prevAmount;
    }
    public void setPrevAmount(Double prevAmount) {
        this.prevAmount = prevAmount;
    }

    public Double getInQty() {
        return inQty;
    }
    public void setInQty(Double inQty) {
        this.inQty = inQty;
    }

    public Double getInAmount() {
        return inAmount;
    }
    public void setInAmount(Double inAmount) {
        this.inAmount = inAmount;
    }

    public Double getOutQty() {
        return outQty;
    }
    public void setOutQty(Double outQty) {
        this.outQty = outQty;
    }

    public Double getOutAmount() {
        return outAmount;
    }
    public void setOutAmount(Double outAmount) {
        this.outAmount = outAmount;
    }

    public Double getStockQty() {
        return stockQty;
    }
    public void setStockQty(Double stockQty) {
        this.stockQty = stockQty;
    }

    public Double getPurchasedQty() {
        return purchasedQty;
    }
    public void setPurchasedQty(Double purchasedQty) {
        this.purchasedQty = purchasedQty;
    }

    public Double getUnitPrice() {
        return unitPrice;
    }
    public void setUnitPrice(Double unitPrice) {
        this.unitPrice = unitPrice;
    }

    public Double getBasePricePercent() {
        return basePricePercent;
    }
    public void setBasePricePercent(Double basePricePercent) {
        this.basePricePercent = basePricePercent;
    }

    public Double getStockAmount() {
        return stockAmount;
    }
    public void setStockAmount(Double stockAmount) {
        this.stockAmount = stockAmount;
    }

    public String getBasePriceCode() {
        return basePriceCode;
    }
    public void setBasePriceCode(String basePriceCode) {
        this.basePriceCode = basePriceCode;
    }

    public String getRemarks() {
        return remarks;
    }
    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getStandardCode() {
        return standardCode;
    }
    public void setStandardCode(String standardCode) {
        this.standardCode = standardCode;
    }

    public String getProductLocation() {
        return productLocation;
    }
    public void setProductLocation(String productLocation) {
        this.productLocation = productLocation;
    }
    // --- 끝 ---
}

import React, { useEffect, useState } from "react";
import "../css/HospitalOrder.css";
import authStorage from "../services/authStorage";
import { fetchAllMedicines } from "../api/medicineApi";

const vendorOptions = [
  { code: "dh-pharm", name: "DH약품" },
  { code: "seoul-pharm", name: "서울제약" },
  { code: "daehan-pharm", name: "대한제약" },
];

const inferUnit = (name = "", spec = "") => {
  const text = `${name} ${spec}`;
  if (text.includes("병")) return "병";
  if (text.includes("박스")) return "박스";
  return "정";
};

export default function HospitalOrder() {
  const [vendorCode, setVendorCode] = useState("dh-pharm");
  const [items, setItems] = useState([
    { name: "", spec: "", quantity: 1, unit: "", unitPrice: 0 },
  ]);
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [medicineError, setMedicineError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );

  useEffect(() => {
    const loadMedicines = async () => {
      setLoadingMedicines(true);
      setMedicineError("");
      try {
        const data = await fetchAllMedicines();
        const mapped = data.map((m) => ({
          name: m.name,
          spec: m.spec || "",
          unit: inferUnit(m.name, m.spec),
          unitPrice: m.unitPrice || m.basePrice || 0,
        }));
        setMedicineOptions(mapped);
      } catch (error) {
        console.error(error);
        setMedicineError("약품 목록을 불러오지 못했습니다.");
      } finally {
        setLoadingMedicines(false);
      }
    };
    loadMedicines();
  }, []);

  const addItem = () => {
    setItems([...items, { name: "", spec: "", quantity: 1, unit: "", unitPrice: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const handleMedicineChange = (index, value) => {
    const selected = medicineOptions.find((m) => m.name === value);
    const next = [...items];
    next[index] = {
      ...next[index],
      name: value,
      spec: selected ? selected.spec : next[index].spec,
      unit: selected ? selected.unit : next[index].unit,
      unitPrice: selected ? selected.unitPrice : next[index].unitPrice,
    };
    setItems(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitMessage("");

    const hasInvalid = items.some(
      (item) => !item.name || Number(item.quantity || 0) <= 0
    );
    if (hasInvalid) {
      alert("약품과 수량을 올바르게 입력해주세요.");
      return;
    }

    const user = authStorage.getUser();
    const orderData = {
      id: `ORDER-${Date.now()}`,
      vendorCode,
      vendorName: vendorOptions.find((v) => v.code === vendorCode)?.name || "도매업체",
      hospitalId: user.hospitalId || "hospital-snu",
      hospitalName: user.hospitalName || "서울대학교병원",
      items,
      totalAmount,
      createdAt: new Date().toISOString(),
      status: "PENDING",
    };

    const existing = JSON.parse(localStorage.getItem("hospital_orders_outbox") || "[]");
    localStorage.setItem("hospital_orders_outbox", JSON.stringify([orderData, ...existing]));
    setSubmitMessage("주문서가 전송되었습니다.");
    setItems([{ name: "", spec: "", quantity: 1, unit: "", unitPrice: 0 }]);
  };

  return (
    <div className="hospital-order">
      <div className="order-header">
        <div>
          <h1>주문서 작성</h1>
          <p className="order-subtitle">필요한 약품을 선택하고 빠르게 주문서를 전송하세요.</p>
        </div>
        <div className="order-summary-card">
          <div className="order-summary-title">주문 요약</div>
          <div className="order-summary-row">
            <span>품목 수</span>
            <strong>{items.length}개</strong>
          </div>
          <div className="order-summary-row">
            <span>총 수량</span>
            <strong>{totalQuantity.toLocaleString()}개</strong>
          </div>
          <div className="order-summary-total">
            <span>예상 금액</span>
            <strong>{totalAmount.toLocaleString()}원</strong>
          </div>
        </div>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        <div className="order-section">
          <div className="order-section-header">
            <h2>주문 대상</h2>
            <span className="order-section-badge">필수</span>
          </div>
          <div className="order-target">
            <label>도매업체</label>
            <select
              className="select-field"
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value)}
            >
              {vendorOptions.map((vendor) => (
                <option key={vendor.code} value={vendor.code}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="order-section">
          <div className="order-section-header">
            <h2>주문 품목</h2>
            <button type="button" className="btn-secondary" onClick={addItem}>
              품목 추가
            </button>
          </div>
          {medicineError && <div className="order-error">{medicineError}</div>}
          <div className="order-items">
            {items.map((item, index) => (
              <div key={index} className="order-item-row">
                <div className="order-item-col">
                  <label className="order-item-label">약품</label>
                  <select
                    className="select-field"
                    value={item.name}
                    onChange={(e) => handleMedicineChange(index, e.target.value)}
                    disabled={loadingMedicines}
                  >
                    <option value="">약품 선택</option>
                    {medicineOptions.map((medicine) => (
                      <option key={`${medicine.name}-${medicine.spec}`} value={medicine.name}>
                        {medicine.name} {medicine.spec ? `(${medicine.spec})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="order-item-col">
                  <label className="order-item-label">수량</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    placeholder="수량"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                </div>
                <div className="order-item-col">
                  <label className="order-item-label">단위</label>
                  <input className="input-field" value={item.unit || "-"} readOnly />
                </div>
                <button
                  type="button"
                  className="btn-outline btn-small"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="order-actions">
          <button type="submit" className="btn-primary">
            주문서 전송
          </button>
        </div>
        {submitMessage && <div className="order-success">{submitMessage}</div>}
      </form>
    </div>
  );
}

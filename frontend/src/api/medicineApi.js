// src/api/medicineApi.js
import API_BASE from "./baseUrl";
import authFetch from "./authFetch";

const BASE_URL = `${API_BASE}/api/medicines`;
const FALLBACK_BASE = API_BASE.includes("localhost")
  ? "https://onliner-xnpa.onrender.com"
  : "http://localhost:8080";
const CACHE_KEY = "medicines_cache";
const DEFAULT_MEDICINES = [
  { id: 1, name: "타이레놀 500mg", spec: "500mg", unitPrice: 500, basePrice: 500, code: "MED-001" },
  { id: 2, name: "아스피린 100mg", spec: "100mg", unitPrice: 300, basePrice: 300, code: "MED-002" },
  { id: 3, name: "게보린정", spec: "정", unitPrice: 800, basePrice: 800, code: "MED-003" },
  { id: 4, name: "판콜에이내복액", spec: "병", unitPrice: 2000, basePrice: 2000, code: "MED-004" },
  { id: 5, name: "베아제정", spec: "정", unitPrice: 150, basePrice: 150, code: "MED-005" },
];

const normalizeMedicine = (raw = {}, index = 0) => {
  const name =
    raw.name ||
    raw.itemName ||
    raw.medicineName ||
    raw.productName ||
    raw.drugName ||
    `미지정 약품 ${index + 1}`;
  const spec =
    raw.spec ||
    raw.standard ||
    raw.specification ||
    raw.unit ||
    "";
  const unitPrice =
    raw.unitPrice ||
    raw.basePrice ||
    raw.price ||
    raw.unit_price ||
    0;
  return {
    id: raw.id || raw.medicineId || raw.productId || raw.code || `${index + 1}`,
    name,
    spec,
    unitPrice,
    basePrice: raw.basePrice || raw.unitPrice || unitPrice,
    code: raw.code || raw.productCode || raw.medicineCode || `MED-${String(index + 1).padStart(3, "0")}`,
  };
};

export const fetchAllMedicines = async () => {
  try {
    const res = await authFetch(BASE_URL);
    if (!res.ok) throw new Error('의약품 목록 조회 실패');
    const data = await res.json();
    const normalized = Array.isArray(data)
      ? data.map((item, idx) => normalizeMedicine(item, idx))
      : [];
    localStorage.setItem(CACHE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (error) {
    try {
      const res = await authFetch(`${FALLBACK_BASE}/api/medicines`);
      if (!res.ok) throw new Error('의약품 목록 조회 실패');
      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data.map((item, idx) => normalizeMedicine(item, idx))
        : [];
      localStorage.setItem(CACHE_KEY, JSON.stringify(normalized));
      return normalized;
    } catch (fallbackError) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          return Array.isArray(parsed)
            ? parsed.map((item, idx) => normalizeMedicine(item, idx))
            : DEFAULT_MEDICINES;
        } catch {
          return DEFAULT_MEDICINES;
        }
      }
      return DEFAULT_MEDICINES;
    }
  }
};

export const uploadExcelFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await authFetch(`${BASE_URL}/upload`, { method: 'POST', body: formData });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText);
  }
  return await res.text(); // 서버가 성공 메시지를 text로 리턴한다고 가정
};

export const updateMedicineById = async (id, payload) => {
  const res = await authFetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText);
  }
  return await res.json();
};

// (선택) 특정 ID 조회
export const fetchMedicineById = async (id) => {
  const res = await authFetch(`${BASE_URL}/${id}`);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText);
  }
  return await res.json();
};

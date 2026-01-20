// src/api/medicineApi.js
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const BASE_URL = `${API_BASE}/api/medicines`;

export const fetchAllMedicines = async () => {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error('의약품 목록 조회 실패');
  return await res.json();
};

export const uploadExcelFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: formData });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText);
  }
  return await res.text(); // 서버가 성공 메시지를 text로 리턴한다고 가정
};

export const updateMedicineById = async (id, payload) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
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
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText);
  }
  return await res.json();
};

// src/pages/VendorStocks.jsx
import React, { useEffect, useState } from 'react';
import '../css/VendorStocks.css'; // 수정된 CSS 파일

const VendorStocks = () => {
  const [medicines, setMedicines] = useState([]);
  const [file, setFile] = useState(null);
  const [savingId, setSavingId] = useState(null); // 저장 중인 행의 id
  const [editCell, setEditCell] = useState({ id: null, field: null });
  const [tempValue, setTempValue] = useState('');

  // 1) 전체 의약품 리스트 조회
  const fetchMedicines = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/medicines');
      if (!res.ok) throw new Error('데이터 조회 실패');
      const data = await res.json();
      setMedicines(data);
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // 2) 엑셀 업로드
  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const onUpload = async () => {
    if (!file) return alert('엑셀 파일을 선택하세요.');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8080/api/medicines/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      const msg = await res.text();
      alert(msg);
      setFile(null);
      fetchMedicines();
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  // 3) 셀 클릭하면 편집 모드 진입
  const handleCellClick = (id, field, currentValue) => {
    setEditCell({ id, field });
    setTempValue(currentValue !== null && currentValue !== undefined ? currentValue : '');
  };

  // 4) 입력값 변경 시
  const handleTempChange = (e) => {
    const { value } = e.target;
    const numericFields = ['basePrice', 'stockQty'];

    if (numericFields.includes(editCell.field)) {
      const sanitized = value === '' ? '' : value.replace(/[^0-9.]/g, '');
      setTempValue(sanitized);
    } else {
      setTempValue(value);
    }
  };

  // 5) 편집 종료(onBlur) 시 백엔드 저장
  const saveCell = async () => {
    const { id, field } = editCell;
    if (id === null || field === null) return;

    const targetMed = medicines.find((m) => m.id === id);
    if (!targetMed) {
      setEditCell({ id: null, field: null });
      return;
    }

    const original = targetMed[field];
    const numericFields = ['basePrice', 'stockQty'];
    const newValue =
      tempValue === ''
        ? numericFields.includes(field)
          ? 0
          : ''
        : numericFields.includes(field)
        ? parseFloat(tempValue)
        : tempValue;

    if (newValue === original) {
      setEditCell({ id: null, field: null });
      return;
    }

    setSavingId(id);
    try {
      const payload = { ...targetMed, [field]: newValue };
      const res = await fetch(`http://localhost:8080/api/medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      const updated = await res.json();
      setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (e) {
      console.error(e);
      alert(`ID ${id} 저장 실패: ${e.message}`);
      fetchMedicines(); // 롤백용
    } finally {
      setSavingId(null);
      setEditCell({ id: null, field: null });
    }
  };

  // 6) Enter 키로 저장 트리거(포커스 아웃)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setEditCell({ id: null, field: null });
    }
  };

  return (
    <div className="vendor-stocks-container">
      <h2 className="vendor-stocks-title">재고관리</h2>

      {/* 엑셀 업로드 영역 */}
      <div className="file-upload-area">
        <input type="file" accept=".xlsx,.xls" onChange={onFileChange} />
        <button onClick={onUpload}>업로드</button>
      </div>

      {/* 재고 목록 테이블 */}
      <table className="vendor-stocks-table">
        <thead>
          <tr>
            <th>제품명</th>
            <th>코드</th>
            <th>제조사</th>
            <th>기준가</th>
            <th>재고수량</th>
            <th>표준코드</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.code}</td>
              <td>{m.manufacturer}</td>

              <td
                onClick={() => handleCellClick(m.id, 'basePrice', m.basePrice ?? '')}
                className="clickable-cell"
              >
                {editCell.id === m.id && editCell.field === 'basePrice' ? (
                  <input
                    autoFocus
                    type="text"
                    value={tempValue}
                    onChange={handleTempChange}
                    onBlur={saveCell}
                    onKeyDown={handleKeyDown}
                    disabled={savingId === m.id}
                    className="inline-input"
                  />
                ) : (
                  m.basePrice?.toLocaleString() ?? ''
                )}
              </td>

              <td
                onClick={() => handleCellClick(m.id, 'stockQty', m.stockQty ?? '')}
                className="clickable-cell"
              >
                {editCell.id === m.id && editCell.field === 'stockQty' ? (
                  <input
                    autoFocus
                    type="text"
                    value={tempValue}
                    onChange={handleTempChange}
                    onBlur={saveCell}
                    onKeyDown={handleKeyDown}
                    disabled={savingId === m.id}
                    className="inline-input"
                  />
                ) : (
                  m.stockQty ?? ''
                )}
              </td>

              <td>{m.standardCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VendorStocks;

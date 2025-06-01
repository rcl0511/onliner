import React, { useEffect, useState } from 'react';
import '../css/VendorStocks.css'; // css 분리 시

const VendorStocks = () => {
  const [medicines, setMedicines] = useState([]);
  const [file, setFile] = useState(null);
  const [editIdx, setEditIdx] = useState(null);   // 수정 중인 행 인덱스
  const [editRow, setEditRow] = useState({});     // 수정 값

  // 재고 리스트 조회
  const fetchMedicines = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/medicines');
      if (!res.ok) throw new Error('데이터 조회 실패');
      const data = await res.json();
      setMedicines(data);
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // 파일 업로드
  const onFileChange = (e) => setFile(e.target.files[0]);

  const onUpload = async () => {
    if (!file) return alert('엑셀 파일을 선택하세요.');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:5000/api/medicines/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('업로드 실패');
      alert('업로드 성공!');
      setFile(null);
      fetchMedicines();
    } catch (e) {
      alert(e.message);
    }
  };

  // 삭제
  const handleDelete = async (_id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/medicines/${_id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('삭제 실패');
      fetchMedicines();
    } catch (e) {
      alert(e.message);
    }
  };

  // 수정 시작
  const handleEdit = (idx, row) => {
    setEditIdx(idx);
    setEditRow(row);
  };

  // 수정 취소
  const cancelEdit = () => {
    setEditIdx(null);
    setEditRow({});
  };

  // 수정 저장
  const saveEdit = async (_id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/medicines/${_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRow)
      });
      if (!res.ok) throw new Error('수정 실패');
      setEditIdx(null);
      setEditRow({});
      fetchMedicines();
    } catch (e) {
      alert(e.message);
    }
  };

  // 수정 input 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditRow(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="vendor-stocks-page" style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 20 }}>재고 관리</h2>
      {/* 엑셀 업로드 */}
      <div style={{ marginBottom: 18 }}>
        <input type="file" accept=".xlsx,.xls" onChange={onFileChange} />
        <button onClick={onUpload} style={{ marginLeft: 8 }}>업로드</button>
      </div>

      {/* 재고 리스트 */}
      <table className="vendor-stocks-table" border="1" style={{ width: '100%', textAlign: 'center', background: 'white' }}>
        <thead>
          <tr style={{ background: '#F8F8F8' }}>
            <th>제품명</th>
            <th>코드</th>
            <th>제조사</th>
            <th>기준가</th>
            <th>재고수량</th>
            <th>표준코드</th>
            <th>동작</th>
          </tr>
        </thead>
        <tbody>
          {medicines.length === 0 ? (
            <tr>
              <td colSpan={7}>등록된 재고가 없습니다.</td>
            </tr>
          ) : medicines.map((m, i) =>
            editIdx === i ? (
              <tr key={m._id}>
                <td><input name="name" value={editRow.name || ''} onChange={handleInputChange} /></td>
                <td><input name="code" value={editRow.code || ''} onChange={handleInputChange} /></td>
                <td><input name="manufacturer" value={editRow.manufacturer || ''} onChange={handleInputChange} /></td>
                <td><input name="basePrice" value={editRow.basePrice || ''} onChange={handleInputChange} /></td>
                <td><input name="stockQty" value={editRow.stockQty || ''} onChange={handleInputChange} /></td>
                <td><input name="standardCode" value={editRow.standardCode || ''} onChange={handleInputChange} /></td>
                <td>
                  <button onClick={() => saveEdit(m._id)} style={{ marginRight: 4 }}>저장</button>
                  <button onClick={cancelEdit}>취소</button>
                </td>
              </tr>
            ) : (
              <tr key={m._id}>
                <td>{m.name}</td>
                <td>{m.code}</td>
                <td>{m.manufacturer}</td>
                <td>{typeof m.basePrice === 'number' ? m.basePrice.toLocaleString() : m.basePrice}</td>
                <td>{m.stockQty}</td>
                <td>{m.standardCode}</td>
                <td>
                  <button
                    style={{ color: "#fff", background: "#3B82F6", border: "none", borderRadius: 4, padding: "4px 8px", marginRight: 4 }}
                    onClick={() => handleEdit(i, m)}
                  >수정</button>
                  <button
                    style={{ color: "#fff", background: "#EF4444", border: "none", borderRadius: 4, padding: "4px 8px" }}
                    onClick={() => handleDelete(m._id)}
                  >삭제</button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VendorStocks;

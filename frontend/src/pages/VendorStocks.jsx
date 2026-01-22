import React, { useEffect, useState, useRef } from 'react';
import '../css/VendorStocks.css';
import '../css/common.css';

// 가짜 제품명과 제조사로 마스킹하는 함수
const maskMedicineData = (medicine) => {
  if (!medicine) return medicine;
  
  const fakeNames = [
    '테스트제품A', '테스트제품B', '테스트제품C', '테스트제품D', '테스트제품E',
    '테스트제품F', '테스트제품G', '테스트제품H', '테스트제품I', '테스트제품J'
  ];
  const fakeManufacturers = [
    '테스트제조사A', '테스트제조사B', '테스트제조사C', '테스트제조사D', '테스트제조사E',
    '테스트제조사F', '테스트제조사G', '테스트제조사H', '테스트제조사I', '테스트제조사J'
  ];
  
  const index = (medicine.id || 0) % 10;
  
  return {
    ...medicine,
    name: fakeNames[index] || `테스트제품${medicine.id || 'X'}`,
    manufacturer: fakeManufacturers[index] || '테스트제조사',
  };
};

const VendorStocks = () => {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
  const [medicines, setMedicines] = useState([]);
  const [warehouses] = useState([
    { id: 1, name: '인천 제1물류센터' },
    { id: 2, name: '경기 제2물류센터' }
  ]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [threshold] = useState(50);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/medicines`)
      .then(res => res.json())
      .then(data => {
        // 가짜 데이터로 마스킹
        const maskedMedicines = Array.isArray(data) 
          ? data.map(medicine => maskMedicineData(medicine))
          : [];
        setMedicines(maskedMedicines);
      })
      .catch(console.error);
  }, [API_BASE]);

  const filteredMedicines = medicines.filter(m => 
    selectedWarehouse === 'ALL' || m.warehouseId === parseInt(selectedWarehouse)
  );

  const handleExcelUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/medicines/upload-excel`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('엑셀 업로드 실패');
      }

      const data = await res.json();
      alert(`엑셀 데이터 반입 완료: ${data.count || 0}개 항목이 업데이트되었습니다.`);
      
      // 재고 목록 새로고침
      fetch(`${API_BASE}/api/medicines`)
        .then(res => res.json())
        .then(data => {
          // 가짜 데이터로 마스킹
          const maskedMedicines = Array.isArray(data) 
            ? data.map(medicine => maskMedicineData(medicine))
            : [];
          setMedicines(maskedMedicines);
        })
        .catch(console.error);
    } catch (err) {
      console.error(err);
      alert('엑셀 업로드 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="stocks-container" style={{ background: 'white', padding: '32px', minHeight: 'calc(100vh - 48px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800, color: '#1E293B' }}>재고 현황 관리</h2>
          <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>실시간 창고별 재고 및 적정 재고 수준을 관리합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="select-field"
          >
            <option value="ALL">전체 물류센터</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
          />
          <button 
            className="btn-primary" 
            onClick={handleExcelUpload}
            disabled={uploading}
          >
            {uploading ? '업로드 중...' : '엑셀 데이터 반입'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>총 품목 수</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B' }}>{medicines.length}개</div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>재고 부족 알림</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#475BE8' }}>{medicines.filter(m => (m.stockQty || 0) < threshold).length}개</div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>당월 입고 예정</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B' }}>124개</div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
              {['제품코드', '제품명', '제조사', '현재고', '적정재고', '상태'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '16px', fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.map((m) => {
              const masked = maskMedicineData(m);
              return (
              <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '16px', fontSize: '14px', color: '#64748B' }}>{m.code}</td>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{masked.name}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: '#64748B' }}>{masked.manufacturer}</td>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: (m.stockQty || 0) < threshold ? '#475BE8' : '#1E293B' }}>{m.stockQty || 0}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: '#64748B' }}>{threshold}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    fontWeight: 700,
                    background: (m.stockQty || 0) < threshold ? '#EEF2FF' : '#F8FAFC',
                    color: (m.stockQty || 0) < threshold ? '#475BE8' : '#94A3B8'
                  }}>{(m.stockQty || 0) < threshold ? '보충필요' : '정상'}</span>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorStocks;

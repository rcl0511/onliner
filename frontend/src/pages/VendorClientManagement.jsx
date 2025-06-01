// src/pages/VendorClientManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/VendorClientManagement.css';

const clientFields = [
  { name: 'classification', label: '거래처구분', type: 'text' },
  { name: 'code',           label: '코드',      type: 'text' },
  { name: 'nameInternal',   label: '상호내부명', type: 'text' },
  { name: 'nameOriginal',   label: '사업자원어명', type: 'text' },
  { name: 'representative', label: '대표자',     type: 'text' },
  { name: 'dob',            label: '생년월일',   type: 'date' },
  { name: 'businessNumber', label: '사업자번호', type: 'text' },
  { name: 'phone',          label: '전화번호',   type: 'text' },
  { name: 'fax',            label: '팩스번호',   type: 'text' },
  { name: 'zip',            label: '우편번호',   type: 'text' },
  { name: 'address',        label: '사업장주소', type: 'text' },
  { name: 'salesRep',       label: '영업담당',   type: 'text' },
  { name: 'deptHead',       label: '부서장',     type: 'text' },
  { name: 'priceApply',     label: '단가적용처', type: 'text' },
  { name: 'stockApply',     label: '재고적용처', type: 'text' },
  { name: 'invoiceIssue',   label: '계산서발행', type: 'checkbox' },
  { name: 'businessType',   label: '업태',       type: 'text' },
  { name: 'item',           label: '종목',       type: 'text' },
  { name: 'clientType',     label: '거래처종류', type: 'text' },
  { name: 'clientGroup',    label: '거래처그룹', type: 'text' },
  { name: 'contractType',   label: '계약구분',   type: 'text' },
  { name: 'deliveryType',   label: '배송구분',   type: 'text' },
  { name: 'pharmacist',     label: '약사성함',   type: 'text' },
  { name: 'licenseNo',      label: '면허번호',   type: 'text' },
  { name: 'careNo',         label: '요양기관번호', type: 'text' },
  { name: 'narcoticsId',    label: '마약류취급자식별번호', type: 'text' },
  { name: 'deviceClient',   label: '의료기기거래처코드',   type: 'text' },
  { name: 'contact',        label: '거래처담당자', type: 'text' },
  { name: 'email',          label: '이메일',     type: 'text' },
  { name: 'invoiceManager', label: '계산서담당자', type: 'text' },
  { name: 'managerPhone',   label: '담당자핸드폰', type: 'text' },
  { name: 'creditLimit',    label: '여신한도',   type: 'number' },
  { name: 'maxTurnDays',    label: '최대회전일', type: 'number' },
  { name: 'monthlyEstimate',label: '월결재예상일', type: 'number' },
  { name: 'startDate',      label: '거래개시일', type: 'date' },
  { name: 'note1',          label: '비고1',      type: 'text' },
  { name: 'note2',          label: '비고2',      type: 'text' },
  { name: 'active',         label: '거래여부',   type: 'checkbox' },
  { name: 'eInvoice',       label: '전자거래명세서', type: 'checkbox' },
  { name: 'invoiceSystem',  label: '명세서전송시스템', type: 'text' },
  { name: 'externalExclude',label: '외부연동제외', type: 'checkbox' },
  { name: 'prePayment',     label: '선결제유무', type: 'checkbox' },
];

const BASE_URL = 'http://localhost:8080/api/vendors/clients';

export default function VendorClientManagement() {
  const [clients, setClients]        = useState([]);
  const [newClient, setNewClient]    = useState(
    clientFields.reduce((acc, f) => {
      acc[f.name] = f.type === 'checkbox' ? false : '';
      return acc;
    }, {})
  );
  const [showForm, setShowForm]      = useState(false);
  const [excelFile, setExcelFile]    = useState(null);
  const [editClient, setEditClient]  = useState(null);
  const [search, setSearch]          = useState('');

  // 1) 전체 조회
  const loadClients = async () => {
    try {
      const res = await axios.get(BASE_URL);
      setClients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert('조회 실패: ' + (err?.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // 2) 엑셀 업로드
  const handleFileChange = e => setExcelFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!excelFile) {
      alert('파일을 선택해 주세요');
      return;
    }
    const formData = new FormData();
    formData.append('file', excelFile);

    try {
      await axios.post(`${BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('엑셀 업로드 성공');
      setExcelFile(null);
      loadClients();
    } catch (err) {
      alert('엑셀 업로드 실패: ' + (err?.response?.data?.error || err.message));
    }
  };

  // 3) 신규 거래처 입력
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setNewClient(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post(BASE_URL, newClient);
      setShowForm(false);
      setNewClient(
        clientFields.reduce((acc, f) => {
          acc[f.name] = f.type === 'checkbox' ? false : '';
          return acc;
        }, {})
      );
      loadClients();
    } catch (err) {
      alert('거래처 추가 실패: ' + (err?.response?.data?.error || err.message));
    }
  };

  // 4) 수정 버튼 클릭
  const handleEdit = client => {
    setEditClient({ ...client });
    setShowForm(false);
  };

  const handleEditChange = e => {
    const { name, value, type, checked } = e.target;
    setEditClient(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    try {
      // ID 필드는 반드시 `id` 여야 합니다.
      await axios.patch(`${BASE_URL}/${editClient.id}`, editClient);
      setEditClient(null);
      loadClients();
    } catch (err) {
      alert('수정 실패: ' + (err?.response?.data?.error || err.message));
    }
  };

  // 5) 검색
  const handleSearch = async () => {
    try {
      const res = await axios.get(BASE_URL, { params: { q: search } });
      setClients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert('검색 실패: ' + (err?.response?.data?.error || err.message));
    }
  };

  return (
    <div className="client-mgmt-container">
      <h2>거래처 관리</h2>

      {/* 검색 */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="코드/사업자명/사업자번호"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button className="btn" onClick={handleSearch}>검색</button>
      </div>

      {/* 엑셀 업로드 & 신규 추가 버튼 */}
      <div className="top-actions">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          style={{ marginRight: 8 }}
        />
        <button className="btn primary" onClick={handleUpload} style={{ marginRight: 16 }}>
          엑셀 업로드
        </button>
        <button className="btn primary" onClick={() => setShowForm(true)}>
          신규 거래처 추가
        </button>
      </div>

      {/* 거래처 테이블 */}
      <table className="client-table">
        <thead>
          <tr>
            <th>코드</th>
            <th>사업자원어명</th>
            <th>대표자</th>
            <th>사업자번호</th>
            <th>사업장주소</th>
            <th>이메일</th>
            <th>수정</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(clients) && clients.length > 0 ? (
            clients.map((c, index) => (
              <tr key={c.id || c.code || index}>
                <td>{c.code}</td>
                <td>{c.nameOriginal}</td>
                <td>{c.representative}</td>
                <td>{c.businessNumber}</td>
                <td>{c.address}</td>
                <td>{c.email}</td>
                <td>
                  <button className="btn" onClick={() => handleEdit(c)}>
                    정보수정
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>
                조회된 거래처가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 신규 거래처 입력 모달 */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>신규 거래처 입력</h3>
            <form onSubmit={handleSubmit} className="client-form">
              {clientFields.map(f => (
                <div className="form-group" key={f.name}>
                  <label>
                    {f.type === 'checkbox' && (
                      <input
                        type="checkbox"
                        name={f.name}
                        checked={!!newClient[f.name]}
                        onChange={handleChange}
                      />
                    )}
                    {f.label}
                  </label>
                  {f.type !== 'checkbox' && (
                    <input
                      type={f.type}
                      name={f.name}
                      value={newClient[f.name]}
                      onChange={handleChange}
                    />
                  )}
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <button type="submit" className="btn primary">저장</button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowForm(false)}
                >취소</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 거래처 정보 수정 모달 */}
      {editClient && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>거래처 정보 수정</h3>
            <form onSubmit={handleEditSubmit} className="client-form">
              {clientFields.map(f => (
                <div className="form-group" key={f.name}>
                  <label>
                    {f.type === 'checkbox' && (
                      <input
                        type="checkbox"
                        name={f.name}
                        checked={!!editClient[f.name]}
                        onChange={handleEditChange}
                      />
                    )}
                    {f.label}
                  </label>
                  {f.type !== 'checkbox' && (
                    <input
                      type={f.type}
                      name={f.name}
                      value={editClient[f.name] || ''}
                      onChange={handleEditChange}
                    />
                  )}
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <button type="submit" className="btn primary">저장</button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setEditClient(null)}
                >취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

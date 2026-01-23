// src/pages/VendorClientManagement.jsx
import React, { useMemo, useEffect, useState } from "react";
import "../css/VendorClientManagement.css";
import { http } from "../api/http";
import authFetch from "../api/authFetch";
import API_BASE from "../api/baseUrl";

const clientFields = [
  { name: "classification", label: "거래처구분", type: "text" },
  { name: "code", label: "코드", type: "text" },
  { name: "nameInternal", label: "상호내부명", type: "text" },
  { name: "nameOriginal", label: "사업자원어명", type: "text" },
  { name: "representative", label: "대표자", type: "text" },
  { name: "dob", label: "생년월일", type: "date" },
  { name: "businessNumber", label: "사업자번호", type: "text" },
  { name: "phone", label: "전화번호", type: "text" },
  { name: "fax", label: "팩스번호", type: "text" },
  { name: "zip", label: "우편번호", type: "text" },
  { name: "address", label: "사업장주소", type: "text" },
  { name: "salesRep", label: "영업담당", type: "text" },
  { name: "deptHead", label: "부서장", type: "text" },
  { name: "priceApply", label: "단가적용처", type: "text" },
  { name: "stockApply", label: "재고적용처", type: "text" },
  { name: "invoiceIssue", label: "계산서발행", type: "checkbox" },
  { name: "businessType", label: "업태", type: "text" },
  { name: "item", label: "종목", type: "text" },
  { name: "clientType", label: "거래처종류", type: "text" },
  { name: "clientGroup", label: "거래처그룹", type: "text" },
  { name: "contractType", label: "계약구분", type: "text" },
  { name: "deliveryType", label: "배송구분", type: "text" },
  { name: "pharmacist", label: "약사성함", type: "text" },
  { name: "licenseNo", label: "면허번호", type: "text" },
  { name: "careNo", label: "요양기관번호", type: "text" },
  { name: "narcoticsId", label: "마약류취급자식별번호", type: "text" },
  { name: "deviceClient", label: "의료기기거래처코드", type: "text" },
  { name: "contact", label: "거래처담당자", type: "text" },
  { name: "email", label: "이메일", type: "text" },
  { name: "invoiceManager", label: "계산서담당자", type: "text" },
  { name: "managerPhone", label: "담당자핸드폰", type: "text" },
  { name: "creditLimit", label: "여신한도", type: "number" },
  { name: "maxTurnDays", label: "최대회전일", type: "number" },
  { name: "monthlyEstimate", label: "월결재예상일", type: "number" },
  { name: "startDate", label: "거래개시일", type: "date" },
  { name: "note1", label: "비고1", type: "text" },
  { name: "note2", label: "비고2", type: "text" },
  { name: "active", label: "거래여부", type: "checkbox" },
  { name: "eInvoice", label: "전자거래명세서", type: "checkbox" },
  { name: "invoiceSystem", label: "명세서전송시스템", type: "text" },
  { name: "externalExclude", label: "외부연동제외", type: "checkbox" },
  { name: "prePayment", label: "선결제유무", type: "checkbox" },
];

const buildEmptyClient = () =>
  clientFields.reduce((acc, f) => {
    acc[f.name] = f.type === "checkbox" ? false : "";
    return acc;
  }, {});

const BASE_URL = `${API_BASE}/api/vendors/clients`;

// 가짜 데이터로 마스킹하는 함수 (Netlify 배포용)
const maskClientData = (client) => {
  if (!client) return client;
  
  // ID 기반으로 일관된 가짜 데이터 생성
  const fakeNames = ['테스트병원A', '테스트병원B', '테스트병원C', '테스트병원D', '테스트병원E', '테스트병원F', '테스트병원G', '테스트병원H'];
  const fakeRepresentatives = ['홍길동', '김철수', '이영희', '박민수', '정수진', '최동욱', '한미영', '강태호'];
  const fakeBusinessNumbers = ['123-45-67890', '234-56-78901', '345-67-89012', '456-78-90123', '567-89-01234', '678-90-12345', '789-01-23456', '890-12-34567'];
  
  const index = (client.id || 0) % 8;
  
  return {
    ...client,
    nameOriginal: fakeNames[index] || `테스트병원${client.id || 'X'}`,
    representative: fakeRepresentatives[index] || '홍길동',
    businessNumber: fakeBusinessNumbers[index] || '123-45-67890',
    nameInternal: fakeNames[index] || `테스트병원${client.id || 'X'}`,
  };
};

export default function VendorClientManagement() {
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState(buildEmptyClient());
  const [showForm, setShowForm] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 병원별 단가 관리
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPrices, setClientPrices] = useState({}); // { clientId: { productId: price } }
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [products, setProducts] = useState([]);
  
  // 미수금 대시보드
  const [receivables, setReceivables] = useState({}); // { clientId: { total, overdue, lastPayment } }
  
  // 임시계정 발급
  const [showTempAccountModal, setShowTempAccountModal] = useState(null);

  // 1) 전체 조회
  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await http.get(BASE_URL);
      // 가짜 데이터로 마스킹 (Netlify 배포용)
      const maskedClients = Array.isArray(res.data) 
        ? res.data.map(client => maskClientData(client))
        : [];
      setClients(maskedClients);
      
      // 미수금 데이터 로드 (예시) - 대폭 감소
      const mockReceivables = {};
      const clientCount = res.data.length;
      res.data.forEach((c, index) => {
        // 총 미수금: 최대 500만원 이내로 대폭 감소
        // 연체 미수금: 최대 200만원 이내로 대폭 감소
        // 장기 미수 업체: 전체의 5-10% 정도만
        const isLongTerm = index < Math.floor(clientCount * 0.08); // 약 8%만 장기 미수
        mockReceivables[c.id] = {
          total: Math.floor(Math.random() * 5000000), // 최대 500만원
          overdue: isLongTerm ? Math.floor(Math.random() * 2000000) : Math.floor(Math.random() * 500000), // 장기 미수는 최대 200만원, 일반은 50만원
          lastPayment: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          overdueDays: isLongTerm ? Math.floor(30 + Math.random() * 30) : Math.floor(Math.random() * 30) // 장기 미수는 30일 이상
        };
      });
      setReceivables(mockReceivables);
    } catch (err) {
      alert("조회 실패: " + (err?.response?.data?.error || err.message));
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
    fetchProducts();
  }, []);

  // 제품 목록 조회 (단가 설정용)
  const fetchProducts = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/medicines`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.slice(0, 50)); // 처음 50개만
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 검색 결과(프론트 필터링)
  const filteredClients = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return clients;

    return (clients || []).filter((c) => {
      const masked = maskClientData(c);
      const code = (c.code || "").toLowerCase();
      const nameO = (masked.nameOriginal || "").toLowerCase();
      const nameI = (masked.nameInternal || "").toLowerCase();
      const bn = (masked.businessNumber || "").toLowerCase();

      return (
        code.includes(keyword) ||
        nameO.includes(keyword) ||
        nameI.includes(keyword) ||
        bn.includes(keyword)
      );
    });
  }, [clients, search]);

  // 2) 엑셀 업로드
  const handleFileChange = (e) => setExcelFile(e.target.files?.[0] || null);

  const handleUpload = async () => {
    if (!excelFile) {
      alert("파일을 선택해 주세요");
      return;
    }
    const formData = new FormData();
    formData.append("file", excelFile);

    try {
      await http.post(`${BASE_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("엑셀 업로드 성공");
      setExcelFile(null);
      await loadClients();
    } catch (err) {
      alert("엑셀 업로드 실패: " + (err?.response?.data?.error || err.message));
    }
  };

  // 3) 신규 거래처 입력
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewClient((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newClient.code?.trim()) {
      alert("코드는 필수입니다.");
      return;
    }

    try {
      await http.post(BASE_URL, newClient);
      alert("거래처 추가 완료");
      setShowForm(false);
      setNewClient(buildEmptyClient());
      await loadClients();
    } catch (err) {
      alert("거래처 추가 실패: " + (err?.response?.data?.error || err.message));
    }
  };

  // 4) 수정 화면 열기
  const handleEdit = (client) => {
    setEditClient({ ...client });
    setShowForm(false);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditClient((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    alert(
      "수정 저장은 백엔드에 PUT/PATCH 엔드포인트가 있어야 동작합니다."
    );
  };

  // 병원별 단가 설정
  const openPriceModal = (client) => {
    setSelectedClient(client);
    setShowPriceModal(true);
  };

  const saveClientPrice = async (productId, price) => {
    if (!selectedClient) return;
    
    setClientPrices(prev => ({
      ...prev,
      [selectedClient.id]: {
        ...prev[selectedClient.id],
        [productId]: price
      }
    }));
    
    // 실제로는 서버 API 호출
    alert('단가가 저장되었습니다.');
  };

  // 임시계정 발급
  const issueTempAccount = async (client) => {
    try {
      // 실제로는 서버 API 호출
      const tempId = `temp_${Date.now()}`;
      const tempPassword = Math.random().toString(36).slice(-8);
      
      const loginLink = `${window.location.origin}/hospital/login?tempId=${tempId}`;
      
      setShowTempAccountModal({
        client,
        tempId,
        tempPassword,
        loginLink
      });
      
      // SMS 발송 (실제로는 서버에서 처리)
      alert(`임시 계정이 생성되었습니다.\n아이디: ${tempId}\n비밀번호: ${tempPassword}\n로그인 링크가 SMS로 전송되었습니다.`);
    } catch (err) {
      alert('임시계정 발급 실패: ' + err.message);
    }
  };

  return (
    <div className="client-mgmt-container">
      <h2>거래처 관리</h2>

      {/* 미수금 대시보드 */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '16px', color: '#475BE8' }}>미수금 대시보드</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px' }}>총 미수금</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#475BE8' }}>
              {Object.values(receivables).reduce((sum, r) => sum + (r.total || 0), 0).toLocaleString()}원
            </div>
          </div>
          <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px' }}>연체 미수금</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#475BE8' }}>
              {Object.values(receivables).reduce((sum, r) => sum + (r.overdue || 0), 0).toLocaleString()}원
            </div>
          </div>
          <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px' }}>장기 미수 업체</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#475BE8' }}>
              {Object.values(receivables).filter(r => (r.overdueDays || 0) > 30).length}개
            </div>
          </div>
        </div>
      </div>

      {/* 검색 */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="코드/상호/사업자번호로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            width: '300px',
            padding: '10px',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            marginRight: 8
          }}
        />
        <button className="btn" onClick={() => setSearch("")}>
          검색 초기화
        </button>
      </div>

      {/* 엑셀 업로드 & 신규 추가 */}
      <div className="top-actions">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ marginRight: 8 }}
        />
        <button
          className="btn-primary"
          onClick={handleUpload}
          style={{ marginRight: 16 }}
        >
          엑셀 업로드
        </button>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          신규 거래처 추가
        </button>
        <button className="btn-secondary" onClick={loadClients} style={{ marginLeft: 8 }}>
          새로고침
        </button>
      </div>

      {/* 상태 */}
      <div style={{ marginTop: 10, marginBottom: 10, fontSize: 13, opacity: 0.8 }}>
        {loading ? "불러오는 중..." : `총 ${filteredClients.length}건 (전체 ${clients.length}건)`}
      </div>

      {/* 거래처 테이블 */}
      <table className="client-table">
        <thead>
          <tr>
            <th>코드</th>
            <th>사업자원어명</th>
            <th>대표자</th>
            <th>사업자번호</th>
            <th>미수금</th>
            <th>연체일수</th>
            <th>동작</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(filteredClients) && filteredClients.length > 0 ? (
            filteredClients.map((c, index) => {
              const receivable = receivables[c.id] || {};
              const isOverdue = (receivable.overdueDays || 0) > 30;
              return (
                <tr 
                  key={c.id || c.code || index}
                  style={{
                    background: isOverdue ? '#F8FAFC' : 'white'
                  }}
                >
                  <td>{c.code}</td>
                  <td>{maskClientData(c).nameOriginal}</td>
                  <td>{maskClientData(c).representative}</td>
                  <td>{maskClientData(c).businessNumber}</td>
                  <td style={{ fontWeight: 600, color: receivable.overdue ? '#475BE8' : '#1E293B' }}>
                    {receivable.total?.toLocaleString() || 0}원
                    {receivable.overdue > 0 && (
                      <span style={{ color: '#94A3B8', fontSize: '12px', marginLeft: '4px' }}>
                        (연체: {receivable.overdue.toLocaleString()}원)
                      </span>
                    )}
                  </td>
                  <td>
                    {receivable.overdueDays > 0 ? (
                      <span style={{ color: '#475BE8', fontWeight: 600 }}>
                        {receivable.overdueDays}일
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn-outline" onClick={() => handleEdit(c)} style={{ fontSize: '12px', padding: '6px 12px' }}>
                        정보수정
                      </button>
                      <button 
                        className="btn-small" 
                        onClick={() => openPriceModal(c)}
                      >
                        단가설정
                      </button>
                      <button 
                        className="btn-small" 
                        onClick={() => issueTempAccount(c)}
                        style={{ opacity: 0.9 }}
                      >
                        임시계정
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                조회된 거래처가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 병원별 단가 설정 모달 */}
      {showPriceModal && selectedClient && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
            <h3>병원별 단가 설정 - {maskClientData(selectedClient).nameOriginal || selectedClient.code}</h3>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
              같은 약품이라도 병원마다 계약된 공급가가 다를 수 있습니다.
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#5B89FF', color: 'white' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>제품명</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>기본 단가</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>거래처 단가</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>동작</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 20).map((p) => {
                  const clientPrice = clientPrices[selectedClient.id]?.[p.id];
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '10px' }}>{p.name}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {p.basePrice?.toLocaleString() || '-'}원
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {clientPrice ? (
                          <span style={{ fontWeight: 600, color: '#475BE8' }}>
                            {clientPrice.toLocaleString()}원
                          </span>
                        ) : (
                          <span style={{ color: '#999' }}>미설정</span>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input
                          type="number"
                          placeholder="단가 입력"
                          onBlur={(e) => {
                            const price = parseFloat(e.target.value);
                            if (price > 0) {
                              saveClientPrice(p.id, price);
                            }
                          }}
                          style={{
                            width: '120px',
                            padding: '6px',
                            border: '1px solid #D1D5DB',
                            borderRadius: 4
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowPriceModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 임시계정 발급 모달 */}
      {showTempAccountModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>임시계정 발급 완료</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>거래처:</strong> {maskClientData(showTempAccountModal.client).nameOriginal || showTempAccountModal.client.code}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>임시 아이디:</strong> {showTempAccountModal.tempId}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>임시 비밀번호:</strong> {showTempAccountModal.tempPassword}
              </div>
              <div style={{ marginBottom: 16, padding: '12px', background: '#E3F2FD', borderRadius: 4 }}>
                <strong>로그인 링크:</strong>
                <div style={{ marginTop: '8px', wordBreak: 'break-all', fontSize: '14px' }}>
                  {showTempAccountModal.loginLink}
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                로그인 링크가 SMS로 전송되었습니다.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowTempAccountModal(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신규 거래처 입력 모달 */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>신규 거래처 입력</h3>
            <form onSubmit={handleSubmit} className="client-form">
              {clientFields.map((f) => (
                <div className="form-group" key={f.name}>
                  <label>
                    {f.type === "checkbox" && (
                      <input
                        type="checkbox"
                        name={f.name}
                        checked={!!newClient[f.name]}
                        onChange={handleChange}
                        style={{ marginRight: 8 }}
                      />
                    )}
                    {f.label}
                  </label>

                  {f.type !== "checkbox" && (
                    <input
                      type={f.type}
                      name={f.name}
                      value={newClient[f.name]}
                      onChange={handleChange}
                    />
                  )}
                </div>
              ))}

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button type="submit" className="btn primary">
                  저장
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowForm(false)}
                >
                  취소
                </button>
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
              {clientFields.map((f) => (
                <div className="form-group" key={f.name}>
                  <label>
                    {f.type === "checkbox" && (
                      <input
                        type="checkbox"
                        name={f.name}
                        checked={!!editClient[f.name]}
                        onChange={handleEditChange}
                        style={{ marginRight: 8 }}
                      />
                    )}
                    {f.label}
                  </label>

                  {f.type !== "checkbox" && (
                    <input
                      type={f.type}
                      name={f.name}
                      value={editClient[f.name] ?? ""}
                      onChange={handleEditChange}
                    />
                  )}
                </div>
              ))}

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button type="submit" className="btn primary">
                  저장(현재 비활성)
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setEditClient(null)}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

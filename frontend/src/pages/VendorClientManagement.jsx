// src/pages/VendorClientManagement.jsx
import React, { useMemo, useEffect, useState } from "react";
import axios from "axios";
import "../css/VendorClientManagement.css";

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

// ✅ CRA 환경변수 지원 + 기본값
// 예) .env에 REACT_APP_API_BASE_URL=http://localhost:8080
const API_ORIGIN = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const BASE_URL = `${API_ORIGIN}/api/vendors/clients`;

export default function VendorClientManagement() {
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState(buildEmptyClient());
  const [showForm, setShowForm] = useState(false);

  const [excelFile, setExcelFile] = useState(null);

  // 수정 모달(일단 UI는 유지, 저장은 막음)
  const [editClient, setEditClient] = useState(null);

  // ✅ 검색은 서버요청 X, 프론트 필터링
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  // 1) 전체 조회
  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get(BASE_URL);
      setClients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert("조회 실패: " + (err?.response?.data?.error || err.message));
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // ✅ 검색 결과(프론트 필터링)
  const filteredClients = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return clients;

    return (clients || []).filter((c) => {
      const code = (c.code || "").toLowerCase();
      const nameO = (c.nameOriginal || "").toLowerCase();
      const nameI = (c.nameInternal || "").toLowerCase();
      const bn = (c.businessNumber || "").toLowerCase();

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
    // ✅ 백엔드에서 @RequestParam("file")이면 file이 맞음
    formData.append("file", excelFile);

    try {
      await axios.post(`${BASE_URL}/upload`, formData, {
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

    // 최소 검증 (백엔드에서 unique+not null)
    if (!newClient.code?.trim()) {
      alert("코드는 필수입니다.");
      return;
    }

    try {
      await axios.post(BASE_URL, newClient);
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

  // ✅ 중요: 백엔드에 PATCH/PUT 엔드포인트가 확실치 않아서 저장은 막아둠
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    alert(
      "수정 저장은 백엔드에 PUT/PATCH 엔드포인트가 있어야 동작합니다.\n" +
        "현재 서버에서 수정 API가 확인되지 않아(405/404 가능) 일단 UI만 열어둔 상태입니다.\n\n" +
        "원하면 VendorClientController에 @PutMapping(\"/{id}\") 또는 @PatchMapping(\"/{id}\")를 추가해주면 바로 연결해줄게요."
    );
  };

  return (
    <div className="client-mgmt-container">
      <h2>거래처 관리</h2>

      {/* 검색 (프론트 필터링) */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="코드/상호/사업자번호로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginRight: 8 }}
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
          className="btn primary"
          onClick={handleUpload}
          style={{ marginRight: 16 }}
        >
          엑셀 업로드
        </button>
        <button className="btn primary" onClick={() => setShowForm(true)}>
          신규 거래처 추가
        </button>
        <button className="btn" onClick={loadClients} style={{ marginLeft: 8 }}>
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
            <th>사업장주소</th>
            <th>이메일</th>
            <th>수정</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(filteredClients) && filteredClients.length > 0 ? (
            filteredClients.map((c, index) => (
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
              <td colSpan="7" style={{ textAlign: "center" }}>
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

      {/* 거래처 정보 수정 모달 (저장 버튼은 안내만) */}
      {editClient && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>거래처 정보 수정</h3>

            <div
              style={{
                background: "#fff8e1",
                border: "1px solid #ffe0b2",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 12,
                lineHeight: 1.4,
              }}
            >
              ⚠️ 현재 서버에 거래처 수정(PUT/PATCH) API가 확인되지 않아 저장은 막아둔 상태야.
              <br />
              컨트롤러에 <b>@PutMapping("/{`{id}`}")</b> 또는 <b>@PatchMapping("/{`{id}`}")</b>
              를 추가해주면 바로 연결해줄게.
            </div>

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

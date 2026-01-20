// VendorLedger.jsx (일부 발췌 및 수정)

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { FaSearch, FaPaperPlane, FaUpload } from 'react-icons/fa';
import '../css/VendorLedger.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const VendorLedger = () => {
  const [hospitals, setHospitals] = useState([]);
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  // 총합계 상태
  const [totalQty, setTotalQty] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const fileInputRef = useRef(null);

  // ─────────────────────────────────────────────
  // 1) 병원 검색
  useEffect(() => {
    if (!query.trim()) {
      setHospitals([]);
      return;
    }
    fetch(`${API_BASE}/api/vendors/clients?q=${encodeURIComponent(query)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(list => {
        setHospitals(list);
      })
      .catch(err => {
        console.error('병원 검색 중 오류:', err);
      });
  }, [query]);

  // ─────────────────────────────────────────────
  // 2) 거래내역 조회(fetchLedger)
  const fetchLedger = () => {
    if (!selected) {
      alert('병원을 선택해 주세요');
      return;
    }

    setLoading(true);
    const hospitalId = selected._id || selected.id;

    fetch(
      `${API_BASE}/api/vendors/ledger?hospitalId=${hospitalId}&from=${fromDate}&to=${toDate}`
    )
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setLedger(data);
      })
      .catch(err => {
        console.error('거래내역 조회 중 오류:', err);
        alert('거래내역을 불러오는 중 오류가 발생했습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // ─────────────────────────────────────────────
  // 2-1) ledger가 바뀔 때마다 총합을 계산
  useEffect(() => {
    // ledger 배열에 객체들이 { qty: number, amount: number, ... } 형식이라고 가정
    const qtySum = ledger.reduce((acc, row) => acc + (row.qty || 0), 0);
    const amountSum = ledger.reduce((acc, row) => acc + (row.amount || 0), 0);

    setTotalQty(qtySum);
    setTotalAmount(amountSum);
  }, [ledger]);

  // ─────────────────────────────────────────────
  // 3) 거래요청서 보내기(sendRequest)
  const sendRequest = () => {
    if (!selected) {
      alert('병원을 선택해 주세요');
      return;
    }

    const hospitalId = selected._id || selected.id;
    const payload = {
      hospitalId,
      from: fromDate,
      to: toDate,
      // 여기에 `총합계`를 같이 보내도록 추가
      totalQty,
      totalAmount
    };

    fetch(`${API_BASE}/api/vendors/send-ledger-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(() => {
        alert('거래요청서(요약 포함)가 정상적으로 발송되었습니다.');
      })
      .catch(err => {
        console.error('거래요청서 발송 오류:', err);
        alert('거래요청서 발송 중 오류가 발생했습니다.');
      });
  };

  // ─────────────────────────────────────────────
  // 4) 거래장 등록하기(registerLedger)
  const registerLedger = () => {
    if (!selected) {
      alert('먼저 병원을 선택해 주세요');
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ─────────────────────────────────────────────
  // 4-1) handleFileChange: 엑셀 선택 후 업로드
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const hospitalId = selected._id || selected.id;
    const formData = new FormData();
    formData.append('hospitalId', hospitalId);
    formData.append('from', fromDate);
    formData.append('to', toDate);
    formData.append('file', file);

    fetch(`${API_BASE}/api/vendors/upload-ledger`, {
      method: 'POST',
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(() => {
        alert('거래장 파일이 업로드되어 등록되었습니다.');
        fetchLedger();
      })
      .catch(err => {
        console.error('엑셀 업로드 오류:', err);
        alert(`업로드 중 오류가 발생했습니다:\n${err.message}`);
      })
      .finally(() => {
        e.target.value = '';
      });
  };

  // ─────────────────────────────────────────────
  // 5) “업로드” 버튼도 거래장 등록과 동일
  const uploadLedger = () => {
    registerLedger();
  };

  // ─────────────────────────────────────────────
  return (
    <div className="vl-container" style={{ background: 'white', minHeight: 'calc(100vh - 48px)' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 className="vl-title">의약품 거래장 관리</h2>
        <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>병원별 거래 내역을 조회하고 거래장을 관리합니다.</p>
      </div>

      {/* ─────────────────────────────────────────────
          상단: 병원 검색 + 기간 선택 + “조회” 버튼
      ───────────────────────────────────────────── */}
      <div className="vl-controls">
        <div className="vl-dropdown">
          <input
            type="text"
            placeholder="병원명 또는 코드 검색"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
            className="vl-dropdown-input"
            autoComplete="off"
          />
          {dropdownOpen && (
            <ul className="vl-dropdown-list">
              {hospitals.length > 0 ? (
                hospitals.slice(0, 50).map(h => (
                  <li
                    key={h._id || h.id}
                    onClick={() => {
                      setSelected(h);
                      setQuery(h.nameOriginal);
                      setDropdownOpen(false);
                    }}
                    className="vl-dropdown-item"
                  >
                    <FaSearch style={{ marginRight: 4, color: '#888' }} />
                    {h.nameOriginal}{' '}
                    <span className="vl-hospital-code">({h.code})</span>
                  </li>
                ))
              ) : (
                <li className="vl-dropdown-item">검색 결과 없음</li>
              )}
            </ul>
          )}
        </div>

        <div className="vl-date-range">
          <label style={{ marginRight: '8px', fontSize: '14px', fontWeight: 600, color: '#64748B' }}>기간:</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="input-field"
            style={{ width: '140px' }}
          />
          <span style={{ margin: '0 8px', color: '#94A3B8' }}>~</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="input-field"
            style={{ width: '140px' }}
          />
        </div>

        <button onClick={fetchLedger} className="btn-primary">
          <FaSearch /> 조회
        </button>
      </div>

      {/* ─────────────────────────────────────────────
          버튼 그룹: “거래요청서 보내기”, “거래장 등록하기”, “업로드”
      ───────────────────────────────────────────── */}
      <div className="vl-btn-group">
        <button onClick={sendRequest} className="btn-primary">
          <FaPaperPlane /> 거래요청서 보내기
        </button>
        <button onClick={registerLedger} className="btn-primary">
          거래장 등록하기
        </button>
        <button onClick={uploadLedger} className="btn-primary">
          <FaUpload /> 업로드
        </button>
      </div>

      {/* ─────────────────────────────────────────────
          숨겨진 파일 입력창: 엑셀(.xlsx, .xls)
      ───────────────────────────────────────────── */}
      <input
        type="file"
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* ─────────────────────────────────────────────
          로딩 중 스피너 표시
      ───────────────────────────────────────────── */}
      {loading && (
        <div className="vl-loading">
          <span className="spinner"></span> 불러오는 중...
        </div>
      )}

      {/* ─────────────────────────────────────────────
          거래내역 테이블 및 총합계 표시
      ───────────────────────────────────────────── */}
      {!loading && ledger.length > 0 && (
        <>
          <div className="vl-totals">
            <span>총 수량: <strong>{totalQty}</strong></span>
            <span style={{ marginLeft: '20px' }}>
              총 합계금액: <strong>{totalAmount.toLocaleString()}원</strong>
            </span>
          </div>

          <div className="vl-table-wrap">
            <table className="vl-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>주문번호</th>
                  <th>수량</th>
                  <th>단가</th>
                  <th>금액</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.tradeDate || row.date}</td>
                    <td>{row.orderId}</td>
                    <td className="right">{row.qty}</td>
                    <td className="right">{row.unitPrice?.toLocaleString()}</td>
                    <td className="right">{row.amount?.toLocaleString()}</td>
                    <td>{row.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────
          거래내역이 없을 때 표시
      ───────────────────────────────────────────── */}
      {!loading && selected && ledger.length === 0 && (
        <p className="vl-nodata">해당 기간에 거래 내역이 없습니다.</p>
      )}
    </div>
  );
};

export default VendorLedger;

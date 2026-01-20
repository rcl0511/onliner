// src/components/VendorInvoice.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/VendorInvoice.css';

const getTodayDateString = () => {
  return new Date().toISOString().slice(0, 10);
};

const VendorInvoice = () => {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
  
  // (A) 재고 정보(제품 목록 + 단가) 불러오기
  const [stockItems, setStockItems] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [clients, setClients] = useState([]); // 거래처 목록

  // (B) 수기 명세서 폼 상태
  const [invoiceHeader, setInvoiceHeader] = useState({
    customer: '',
    customerId: '',
    invoiceDate: getTodayDateString(),
  });
  const [lineItems, setLineItems] = useState([
    { productId: '', productName: '', unitPrice: 0, quantity: '', lineTotal: 0 },
  ]);

  // (C) PDF 업로드 결과 상태
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);

  // (D) 수동으로 저장된 명세서 리스트
  const [manualEntries, setManualEntries] = useState([]);

  // (E) 체크박스 선택 상태
  const [selectedManual, setSelectedManual] = useState([]);
  const [selectedAuto, setSelectedAuto] = useState([]);

  // (F) 이력 불러오기 관련
  const [orderHistory, setOrderHistory] = useState([]); // 해당 병원의 과거 주문 이력
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const navigate = useNavigate();

  // 가짜 제품명으로 마스킹하는 함수
  const maskProductName = (product) => {
    if (!product) return product;
    const fakeNames = [
      '테스트제품A', '테스트제품B', '테스트제품C', '테스트제품D', '테스트제품E',
      '테스트제품F', '테스트제품G', '테스트제품H', '테스트제품I', '테스트제품J'
    ];
    const index = (product.id || 0) % 10;
    return {
      ...product,
      name: fakeNames[index] || `테스트제품${product.id || 'X'}`,
    };
  };

  // (A-1) 재고 API 호출
  const fetchStockItems = useCallback(async () => {
    setLoadingStock(true);
    try {
      const res = await fetch(`${API_BASE}/api/medicines`);
      if (!res.ok) throw new Error('재고 정보 조회 실패');
      const data = await res.json();
      // 가짜 제품명으로 마스킹
      const items = data.map((m) => {
        const masked = maskProductName(m);
        return {
          id: m.id,
          name: masked.name,
          unitPrice: m.unitPrice || m.basePrice || 0,
          code: m.code,
        };
      });
      setStockItems(items);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoadingStock(false);
    }
  }, [API_BASE]);

  // 거래처 목록 조회 (테스트 데이터)
  const fetchClients = useCallback(async () => {
    // 실제 DB 대신 테스트 데이터 사용
    const testClients = [
      { id: 1, nameOriginal: '테스트병원A', nameInternal: '테스트병원A', code: 'TEST001' },
      { id: 2, nameOriginal: '테스트병원B', nameInternal: '테스트병원B', code: 'TEST002' },
      { id: 3, nameOriginal: '테스트병원C', nameInternal: '테스트병원C', code: 'TEST003' },
      { id: 4, nameOriginal: '테스트병원D', nameInternal: '테스트병원D', code: 'TEST004' },
      { id: 5, nameOriginal: '테스트병원E', nameInternal: '테스트병원E', code: 'TEST005' },
    ];
    setClients(testClients);
  }, []);

  // 과거 주문 이력 조회
  const fetchOrderHistory = async (customerId) => {
    try {
      // 실제로는 서버 API 호출: /api/invoices/history?customerId=xxx
      // 예시 데이터
      const mockHistory = [
        {
          id: 1,
          date: '2024-05-28',
          lineItems: [
            { productId: 1, productName: '타이레놀500mg', unitPrice: 5000, quantity: 100 },
            { productId: 2, productName: '아스피린', unitPrice: 3000, quantity: 50 },
          ]
        },
        {
          id: 2,
          date: '2024-05-21',
          lineItems: [
            { productId: 1, productName: '타이레놀500mg', unitPrice: 5000, quantity: 80 },
            { productId: 3, productName: '게보린', unitPrice: 4000, quantity: 30 },
          ]
        }
      ];
      setOrderHistory(mockHistory);
    } catch (e) {
      console.error(e);
    }
  };

  // 초기 마운트 시 재고 정보 가져오기
  useEffect(() => {
    fetchStockItems();
    fetchClients();
  }, [fetchStockItems, fetchClients]);

  // 거래처 변경 시 이력 불러오기
  useEffect(() => {
    if (invoiceHeader.customerId) {
      fetchOrderHistory(invoiceHeader.customerId);
    }
  }, [invoiceHeader.customerId]);

  // (B-2) 수기 명세서 헤더 변경 핸들러
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setInvoiceHeader((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // (B-3) 라인 아이템: 제품 선택 시 단가 채우고 초기화
  const handleLineProductChange = (index, selectedId) => {
    const selected = stockItems.find((i) => i.id.toString() === selectedId);
    setLineItems((prev) =>
      prev.map((line, idx) => {
        if (idx !== index) return line;
        return {
          ...line,
          productId: selected ? selected.id : '',
          productName: selected ? selected.name : '',
          unitPrice: selected ? selected.unitPrice : 0,
          quantity: '',
          lineTotal: 0,
        };
      })
    );
  };

  // (B-4) 라인 아이템: 수량 변경 시 총액 계산
  const handleLineQtyChange = (index, qtyValue) => {
    const qtyClean = qtyValue === '' ? '' : qtyValue.replace(/[^0-9]/g, '');
    setLineItems((prev) =>
      prev.map((line, idx) => {
        if (idx !== index) return line;
        const quantityNum = qtyClean === '' ? 0 : parseInt(qtyClean, 10);
        const total = quantityNum * (line.unitPrice || 0);
        return {
          ...line,
          quantity: qtyClean,
          lineTotal: total,
        };
      })
    );
  };

  // (B-5) 라인 아이템 추가 (Grid 입력 - 엑셀처럼 행 추가)
  const handleAddLine = () => {
    setLineItems((prev) => [
      ...prev,
      { productId: '', productName: '', unitPrice: 0, quantity: '', lineTotal: 0 },
    ]);
  };

  // (B-6) 라인 아이템 삭제 (최소 1줄 유지)
  const handleRemoveLine = (index) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // (B-7) 합계 금액 계산
  const calculateGrandTotal = () => {
    return lineItems.reduce((sum, line) => sum + (line.lineTotal || 0), 0);
  };

  // 이력 불러오기 - 지난주 주문 내역 복사
  const loadHistory = (historyItem) => {
    setLineItems(
      historyItem.lineItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: '',
        lineTotal: 0,
      }))
    );
    setShowHistoryModal(false);
    alert('이력을 불러왔습니다. 수량을 수정해주세요.');
  };

  // (B-8) 수기 명세서 저장 핸들러
  const handleManualSubmit = (e) => {
    e.preventDefault();
    const { customer, invoiceDate } = invoiceHeader;
    if (!customer || !invoiceDate) {
      alert('매출처와 명세일자는 반드시 입력해야 합니다.');
      return;
    }

    for (const line of lineItems) {
      if (!line.productId) {
        alert('제품을 선택해주세요.');
        return;
      }
      if (!line.quantity || parseInt(line.quantity, 10) <= 0) {
        alert('수량을 1 이상으로 입력해주세요.');
        return;
      }
    }

    const newKey = Date.now().toString();
    const newEntry = {
      key: newKey,
      customer,
      invoiceDate,
      lineItems: [...lineItems],
      grandTotal: calculateGrandTotal(),
    };

    setManualEntries((prev) => [newEntry, ...prev]);
    setInvoiceHeader({ customer: '', customerId: '', invoiceDate: getTodayDateString() });
    setLineItems([{ productId: '', productName: '', unitPrice: 0, quantity: '', lineTotal: 0 }]);
  };

  // (C-1) 파일 선택 시 실행
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // (C-2) PDF 다중 업로드 핸들러
  const handleUpload = async () => {
    if (files.length === 0) {
      alert('업로드할 PDF 파일을 선택하세요!');
      return;
    }

    const formData = new FormData();
    files.forEach((f) => formData.append('invoices', f));

    try {
      const res = await fetch(`${API_BASE}/api/invoices/upload-multiple`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`서버 오류 ${res.status}\n${errText}`);
      }
      const { files: uploaded } = await res.json();
      const timestamp = Date.now();
      const withKeys = uploaded.map((f, idx) => ({
        ...f,
        key: `auto-${timestamp}-${idx}`,
        fileName: f.pdfFileName || f.pdfUrl.split('/').pop(),
      }));
      setResults(withKeys);
    } catch (err) {
      console.error('다중 업로드 실패:', err);
      alert(`업로드 중 오류 발생: ${err.message}`);
    }
  };

  // (E-1) manualEntries 또는 results 변경 시 기본 선택 상태 세팅
  useEffect(() => {
    const manualKeys = manualEntries.map((entry) => entry.key);
    setSelectedManual(manualKeys);

    const autoKeys = results.map((r) => r.key);
    setSelectedAuto(autoKeys);
  }, [manualEntries, results]);

  // (E-2) 체크박스 토글: 수동
  const toggleManual = (key) => {
    setSelectedManual((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // (E-3) 체크박스 토글: 자동
  const toggleAuto = (key) => {
    setSelectedAuto((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // (E-4) 선택된 명세서를 배송 관리 페이지로 이동
  const handleGoDelivery = () => {
    const manual = manualEntries.filter((e) => selectedManual.includes(e.key));
    const auto = results.filter((r) => selectedAuto.includes(r.key));
    navigate('/vendor/delivery', { state: { manual, auto } });
  };

  return (
    <div className="invoice-container">
      <div style={{ marginBottom: '32px' }}>
        <h2 className="invoice-title">명세서 발행</h2>
        <p className="invoice-subtitle">수기 명세서 등록 및 PDF 업로드를 통해 거래명세서를 발행합니다.</p>
      </div>

      {/* 1. 수기 명세서 등록 폼 */}
      <section className="manual-section">
        <h3 className="section-heading">수기 명세서 등록</h3>
        <form className="manual-form" onSubmit={handleManualSubmit}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
            <div className="form-row" style={{ flex: 1 }}>
              <label>매출처</label>
              <select
                name="customerId"
                value={invoiceHeader.customerId}
                onChange={handleHeaderChange}
                className="select-field"
              >
                <option value="">거래처 선택</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameOriginal || c.nameInternal || c.code}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="customer"
                value={invoiceHeader.customer}
                onChange={handleHeaderChange}
                placeholder="또는 직접 입력"
                className="input-field"
                style={{ marginTop: '8px' }}
              />
            </div>
            <div className="form-row" style={{ flex: 0, minWidth: '200px' }}>
              <label>명세일자</label>
              <input
                type="date"
                name="invoiceDate"
                value={invoiceHeader.invoiceDate}
                onChange={handleHeaderChange}
                className="input-field"
              />
            </div>
          </div>

          {/* 이력 불러오기 버튼 */}
          {invoiceHeader.customerId && orderHistory.length > 0 && (
            <div className="form-row">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="btn-primary"
                >
                  이력 불러오기
                </button>
            </div>
          )}

          {/* Grid 입력 - 엑셀처럼 테이블 형태 */}
          <div className="line-items-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontWeight: 600, fontSize: '15px', color: '#1E293B' }}>품목</label>
              <button
                type="button"
                onClick={handleAddLine}
                className="btn-small"
              >
                행 추가
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>제품명</th>
                  <th style={{ textAlign: 'right' }}>단가</th>
                  <th style={{ textAlign: 'right' }}>수량</th>
                  <th style={{ textAlign: 'right' }}>금액</th>
                  <th style={{ textAlign: 'center', width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        value={line.productId}
                        onChange={(e) => handleLineProductChange(idx, e.target.value)}
                        disabled={loadingStock}
                        className="select-field"
                        style={{ width: '100%' }}
                      >
                        <option value="">-- 제품 선택 --</option>
                        {stockItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.code})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="text"
                        readOnly
                        value={line.unitPrice?.toLocaleString() || ''}
                        className="input-field"
                        style={{ width: '100%', textAlign: 'right', background: '#F8FAFC' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => handleLineQtyChange(idx, e.target.value)}
                        min="0"
                        className="input-field"
                        style={{ width: '100%', textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#1E293B' }}>
                      {line.lineTotal?.toLocaleString() || 0}원
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="btn-outline"
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                          >
                            삭제
                          </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-row full-width">
            <label>합계금액</label>
            <input
              type="text"
              readOnly
              value={calculateGrandTotal().toLocaleString() + '원'}
              className="grand-total-field"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              명세서 저장
            </button>
          </div>
        </form>
      </section>

      {/* 이력 불러오기 모달 */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 8,
            width: '90%',
            maxWidth: 800,
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: 16 }}>과거 주문 이력</h3>
            <div style={{ marginBottom: 16 }}>
              {orderHistory.map((history) => (
                <div
                  key={history.id}
                  style={{
                    padding: 16,
                    border: '1px solid #E5E7EB',
                    borderRadius: 4,
                    marginBottom: 12,
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  onClick={() => loadHistory(history)}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    {history.date} 주문 내역
                  </div>
                  <div>
                    {history.lineItems.map((item, i) => (
                      <div key={i} style={{ fontSize: '14px', color: '#666', marginBottom: 4 }}>
                        {item.productName} × {item.quantity} @ {item.unitPrice?.toLocaleString()}원
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
                    클릭하여 이력 불러오기
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowHistoryModal(false)}
              style={{
                padding: '10px 24px',
                background: '#E5E7EB',
                color: '#111827',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 2. PDF 업로드 섹션 */}
      <section className="upload-section">
        <h3 className="section-heading">PDF 업로드 및 파싱</h3>
        <div className="upload-controls">
          <input
            type="file"
            id="pdf-file-input"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="pdf-file-input" className="file-upload-button">
            파일 선택
          </label>
          {files.length > 0 && (
            <span style={{ fontSize: '14px', color: '#64748B' }}>
              {files.length}개 파일 선택됨
            </span>
          )}
          <button onClick={handleUpload} className="btn-primary" disabled={files.length === 0}>
            PDF 업로드
          </button>
        </div>
      </section>

      {/* 3. 결과 카드 리스트 */}
      <section className="results-section">
        {(manualEntries.length > 0 || results.length > 0) && (
          <h3 className="section-heading">명세서 리스트</h3>
        )}
        <div className="cards-container">
          {/* 3-1. 수동 입력 카드 */}
          {manualEntries.map((entry) => {
            const key = entry.key;
            const checked = selectedManual.includes(key);

            return (
              <div key={key} className="invoice-card">
                <div className="card-header manual-tag">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleManual(key)}
                    style={{ marginRight: '8px' }}
                  />
                  <span>수동</span>
                </div>
                <div className="card-body">
                  <h4 className="card-title">
                    {entry.invoiceDate} - {entry.customer}
                  </h4>
                  <div className="card-lines">
                    {entry.lineItems.map((line, i) => (
                      <p key={i} className="card-row">
                        {line.productName} × {line.quantity} @{' '}
                        {line.unitPrice.toLocaleString()} ={' '}
                        {line.lineTotal.toLocaleString()}
                      </p>
                    ))}
                  </div>
                  <p className="card-row total-row">
                    합계: {entry.grandTotal.toLocaleString()}원
                  </p>
                </div>
              </div>
            );
          })}

          {/* 3-2. PDF 파싱 결과 카드 */}
          {results.map((r) => {
            const filename = r.pdfUrl.split('/').pop();
            const key = r.key;
            const checked = selectedAuto.includes(key);

            return (
              <div key={key} className="invoice-card">
                <div className="card-header auto-tag">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAuto(key)}
                    style={{ marginRight: '8px' }}
                  />
                  <span>자동</span>
                </div>
                <div className="card-body">
                  <h4 className="card-title">{r.originalName}</h4>
                  <p className="card-row">
                    생성된 PDF:{' '}
                    <a
                      href={`${API_BASE}${r.pdfUrl}`}
                      download
                      target="_blank"
                      rel="noreferrer"
                    >
                      {filename}
                    </a>
                  </p>
                  {r.parsedText && (
                    <>
                      <h5 className="parsed-heading">파싱 결과:</h5>
                      <pre className="parsed-text">{r.parsedText}</pre>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. 선택 항목 전송 버튼 */}
        {(selectedManual.length > 0 || selectedAuto.length > 0) && (
          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn-primary" onClick={handleGoDelivery}>
              선택한 명세서를 배송 관리로 이동
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default VendorInvoice;

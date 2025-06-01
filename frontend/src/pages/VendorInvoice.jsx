// src/components/VendorInvoice.jsx
import React, { useEffect, useState } from 'react';
import '../css/VendorInvoice.css';


  const getTodayDateString = () => {
  return new Date().toISOString().slice(0, 10);
};
const VendorInvoice = () => {
  // (A) 재고 정보(제품 목록 + 단가) 불러오기
  const [stockItems, setStockItems] = useState([]); // { id, name, unitPrice, stockQty, ... }
  const [loadingStock, setLoadingStock] = useState(false);

  // (B) 수기 명세서 폼 상태
  const [invoiceHeader, setInvoiceHeader] = useState({
    customer: '',    // 매출처
    invoiceDate: getTodayDateString(),
  });

  // 라인 아이템 배열 (최소 1줄로 시작)
  const [lineItems, setLineItems] = useState([
    { productId: '', productName: '', unitPrice: 0, quantity: '', lineTotal: 0 }
  ]);

  // (C) PDF 업로드 결과 상태 (기존 코드 유지)
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);

  // (D) 전체 카드(수동 + 자동) 리스트 (임시: 저장 시 entry에 추가)
  const [manualEntries, setManualEntries] = useState([]);



  useEffect(() => {
    fetchStockItems();
  }, []);

  // 1) 재고 API로부터 제품 목록 + 단가를 가져옴
  const fetchStockItems = async () => {
    setLoadingStock(true);
    try {
      const res = await fetch('http://localhost:8080/api/medicines');
      if (!res.ok) throw new Error('재고 정보 조회 실패');
      const data = await res.json();
      // data 배열에서 id, name, unitPrice 필드만 추출해 저장
      const items = data.map((m) => ({
        id: m.id,
        name: m.name,
        unitPrice: m.unitPrice,
      }));
      setStockItems(items);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoadingStock(false);
    }
  };

  // 2) 수기 명세서 헤더 입력 핸들러
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setInvoiceHeader((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 3) 라인 아이템에서 제품명 선택 시 단가 자동 채워주고, 총액 계산
  const handleLineProductChange = (index, selectedId) => {
    // 선택된 제품 정보 찾기
    const selected = stockItems.find((i) => i.id.toString() === selectedId);
    setLineItems((prev) =>
      prev.map((line, idx) => {
        if (idx !== index) return line;
        return {
          ...line,
          productId: selected ? selected.id : '',
          productName: selected ? selected.name : '',
          unitPrice: selected ? selected.unitPrice : 0,
          quantity: '',       // 수량 초기화
          lineTotal: 0,       // 총액 초기화
        };
      })
    );
  };

  // 4) 라인 아이템에서 수량 변경 시 총액(lineTotal) 계산
  const handleLineQtyChange = (index, qtyValue) => {
    // 숫자로만, 빈 문자열도 허용
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

  // 5) 라인 아이템 추가
  const handleAddLine = () => {
    setLineItems((prev) => [
      ...prev,
      { productId: '', productName: '', unitPrice: 0, quantity: '', lineTotal: 0 }
    ]);
  };

  // 6) 라인 아이템 삭제 (마지막 한 줄은 삭제하지 않음)
  const handleRemoveLine = (index) => {
    if (lineItems.length === 1) return; // 최소 1줄 유지
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // 7) 합계 금액 계산 (모든 lineTotal 합)
  const calculateGrandTotal = () => {
    return lineItems.reduce((sum, line) => sum + (line.lineTotal || 0), 0);
  };

  // 8) 수기 명세서 “저장” 버튼 클릭 핸들러
  const handleManualSubmit = (e) => {
    e.preventDefault();
    const { customer, invoiceDate } = invoiceHeader;
    if (!customer || !invoiceDate) {
      alert('매출처와 명세일자는 반드시 입력해야 합니다.');
      return;
    }

    // 각 라인이 유효한지 체크
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

    // 새로운 항목 객체 생성
    const newEntry = {
      customer,
      invoiceDate,
      lineItems: [...lineItems],
      grandTotal: calculateGrandTotal(),
      timestamp: Date.now(),
    };

    // 로컬 상태에 추가 (실제로는 백엔드 호출이 필요할 수 있음)
    setManualEntries((prev) => [newEntry, ...prev]);

    // 폼 초기화
    setInvoiceHeader({ customer: '', invoiceDate: '' });
    setLineItems([
      { productId: '', productName: '', unitPrice: 0, quantity: '', lineTotal: 0 }
    ]);
  };

  // 9) PDF 업로드 핸들러 (기존 코드)
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

    const handleUpload = async () => {
    if (files.length === 0) {
      alert('업로드할 PDF 파일을 선택하세요!');
      return;
    }

    const formData = new FormData();
    files.forEach((f) => formData.append('invoices', f));

    try {
      // ↓ 아래 URL을 Spring Boot 서버 주소와 맞춰 수정합니다.
      const res = await fetch('http://localhost:8080/api/invoices/upload-multiple', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`서버 오류 ${res.status}\n${errText}`);
      }
      const { files: uploaded } = await res.json();
      setResults(uploaded);
    } catch (err) {
      console.error('다중 업로드 실패:', err);
      alert(`업로드 중 오류 발생: ${err.message}`);
    }
  };
  return (
    <div className="invoice-container">
      <h2 className="invoice-title">명세서 관리</h2>

      {/* 1. 수기 명세서 등록 폼 */}
      <section className="manual-section">
        <h3 className="section-heading">수기 명세서 등록</h3>
        <form className="manual-form" onSubmit={handleManualSubmit}>
          <div className="form-row">
            <label>매출처</label>
            <input
              type="text"
              name="customer"
              value={invoiceHeader.customer}
              onChange={handleHeaderChange}
              placeholder="거래처 입력"
            />
          </div>
          <div className="form-row">
            <label>명세일자</label>
            <input
              type="date"
              name="invoiceDate"
              value={invoiceHeader.invoiceDate}
              onChange={handleHeaderChange}
            />
          </div>

          <div className="line-items-section">
            <label>품목</label>
            {lineItems.map((line, idx) => (
              <div key={idx} className="line-item-row">
                <select
                  value={line.productId}
                  onChange={(e) =>
                    handleLineProductChange(idx, e.target.value)
                  }
                  disabled={loadingStock}
                >
                  <option value="">-- 제품 선택 --</option>
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  readOnly
                  value={line.unitPrice?.toLocaleString() || ''}
                  placeholder="단가"
                  className="unit-price-field"
                />
                <input
                  type="number"
                  value={line.quantity}
                  onChange={(e) =>
                    handleLineQtyChange(idx, e.target.value)
                  }
                  placeholder="수량"
                  min="0"
                />
                <input
                  type="text"
                  readOnly
                  value={line.lineTotal?.toLocaleString() || ''}
                  placeholder="금액"
                  className="line-total-field"
                />
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    className="remove-line-btn"
                    onClick={() => handleRemoveLine(idx)}
                  >
                    ×
                  </button>
                )}
                {idx === lineItems.length - 1 && (
                  <button
                    type="button"
                    className="add-line-btn"
                    onClick={handleAddLine}
                  >
                    +
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-row full-width">
            <label>합계금액</label>
            <input
              type="text"
              readOnly
              value={calculateGrandTotal().toLocaleString()}
              className="grand-total-field"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              저장
            </button>
          </div>
        </form>
      </section>

      {/* 2. PDF 업로드 섹션 (기존) */}
      <section className="upload-section">
        <h3 className="section-heading">PDF 업로드 및 파싱</h3>
        <div className="upload-controls">
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
          />
          <button onClick={handleUpload} className="btn-primary">
            업로드 시작
          </button>
        </div>
      </section>

      {/* 3. 결과 카드 리스트 */}
      <section className="results-section">
        {(manualEntries.length > 0 || results.length > 0) && (
          <h3 className="section-heading">명세서 리스트</h3>
        )}
        <div className="cards-container">
          {/* 수동 입력 */}
          {manualEntries.map((entry, idx) => (
            <div key={`manual-${idx}`} className="invoice-card">
              <div className="card-header manual-tag">수동</div>
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
          ))}

          {/* PDF 파싱 결과 */}
          {results.map((r, idx) => {
            const filename = r.pdfUrl.split('/').pop();
            return (
              <div key={`auto-${idx}`} className="invoice-card">
                <div className="card-header auto-tag">자동</div>
                <div className="card-body">
                  <h4 className="card-title">{r.originalName}</h4>
                  <p className="card-row">
                    생성된 PDF:{' '}
                    <a
                      href={`http://localhost:5000${r.pdfUrl}`}
                      download={filename}
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
      </section>
    </div>
  );
};

export default VendorInvoice;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import SignaturePad from '../components/SignaturePad';
import signatureService from '../services/signatureService';
import '../css/HospitalInvoice.css';

const HospitalInvoice = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [signature, setSignature] = useState(null);
  const [signatureMetadata, setSignatureMetadata] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeType, setDisputeType] = useState('');
  const [disputeMemo, setDisputeMemo] = useState('');
  const [showSignatureInfo, setShowSignatureInfo] = useState(false);

  // 1회성 링크 처리 (토큰 기반 접속)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // 토큰 검증 (실제로는 서버에서 검증)
      // 24시간 유효성 체크
      console.log('1회성 링크로 접속:', token);
    }

    // 명세서 데이터 로드 (실제로는 API 호출)
    loadInvoice();
  }, [invoiceId, searchParams]);

  // 명세서 로드 후 해당 명세서의 서명 불러오기
  useEffect(() => {
    if (invoiceId) {
      const saved = signatureService.getSignature(invoiceId);
      if (saved) {
        setSignature(saved.signatureData);
        setSignatureMetadata(saved.metadata);
      }
    }
  }, [invoiceId]);

  const loadInvoice = () => {
    // 임시 데이터
    const mockInvoice = {
      id: invoiceId || 'INV-2024-001',
      vendorName: 'DH약품',
      vendorCode: 'dh-pharm',
      vendorAddress: '서울시 강남구 테헤란로 123',
      vendorPhone: '02-1234-5678',
      hospitalName: '서울대학교병원',
      hospitalAddress: '서울시 종로구 대학로 101',
      date: '2024-01-15',
      items: [
        { name: '타이레놀 500mg', quantity: 100, unit: '정', unitPrice: 50, total: 5000 },
        { name: '아스피린 100mg', quantity: 200, unit: '정', unitPrice: 30, total: 6000 },
        { name: '게보린정', quantity: 50, unit: '정', unitPrice: 80, total: 4000 },
        { name: '판콜에이내복액', quantity: 30, unit: '병', unitPrice: 2000, total: 60000 },
        { name: '베아제정', quantity: 20, unit: '정', unitPrice: 150, total: 3000 },
      ],
      subtotal: 78000,
      tax: 7800,
      total: 85800,
      status: 'unread',
      version: 1,
      parentInvoiceId: null,
      revisionHistory: [] // 수정 명세서 히스토리
    };

    // 수정 명세서인 경우 히스토리 로드
    if (invoiceId === 'INV-2024-004-v2') {
      mockInvoice.parentInvoiceId = 'INV-2024-004';
      mockInvoice.version = 2;
      mockInvoice.revisionHistory = [
        {
          version: 1,
          invoiceId: 'INV-2024-004',
          date: '2024-01-12',
          status: 'disputed',
          disputeReason: '수량 부족'
        }
      ];
    }

    setInvoice(mockInvoice);
  };

  const handleSignatureSave = async (signatureData) => {
    // 명세서별 개별 서명 저장 (메타데이터 포함)
    const signatureRecord = await signatureService.saveSignature(invoiceId, signatureData);
    setSignature(signatureData);
    setSignatureMetadata(signatureRecord.metadata);
  };

  const handleConfirm = async () => {
    if (!signature) {
      alert('서명을 먼저 저장해주세요.');
      return;
    }

    // 서명 메타데이터와 함께 확인 완료 처리 (실제로는 API 호출)
    const confirmData = {
      invoiceId,
      signature: signature,
      metadata: signatureMetadata,
      confirmedAt: new Date().toISOString(),
    };

    console.log('명세서 확인 완료:', confirmData);
    
    // 실제로는 서버 API 호출
    // await fetch('/api/invoices/confirm', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(confirmData)
    // });

    alert('명세서가 확인되었습니다.');
    navigate('/hospital/inbox');
  };

  const handleDispute = async () => {
    if (!disputeType || !disputeMemo) {
      alert('이의 사유와 메모를 입력해주세요.');
      return;
    }

    // 기존 서명 삭제 (이의 신청 시)
    if (signature) {
      signatureService.deleteSignature(invoiceId);
      setSignature(null);
      setSignatureMetadata(null);
    }

    // 이의 신청 처리 (실제로는 API 호출)
    const disputeData = {
      invoiceId,
      disputeType,
      disputeMemo,
      requestedAt: new Date().toISOString(),
      userId: signatureService.getUserId(),
    };

    console.log('이의 신청:', disputeData);
    
    // 실제로는 서버 API 호출
    // await fetch('/api/invoices/dispute', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(disputeData)
    // });

    alert('이의 신청이 접수되었습니다. 도매업체에서 확인 후 수정 명세서를 발행합니다.');
    setShowDisputeModal(false);
    navigate('/hospital/inbox');
  };

  const handleDownloadPDF = () => {
    // PDF 다운로드 (실제로는 서버에서 PDF 생성)
    alert('PDF 다운로드 기능은 준비 중입니다.');
  };

  if (!invoice) {
    return <div className="invoice-loading">로딩 중...</div>;
  }

  const totalItems = invoice.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="hospital-invoice-detail">
      <div className="invoice-header">
        <button className="btn-secondary" onClick={() => navigate('/hospital/inbox')}>
          ← 목록으로
        </button>
        <h1>명세서 상세</h1>
      </div>

      <div className="invoice-split-layout">
        {/* 왼쪽: 명세서 뷰어 */}
        <div className="invoice-viewer">
          <div className="invoice-document">
              <div className="invoice-doc-header">
                <h2>거래명세서</h2>
                {invoice.version > 1 && (
                  <div className="invoice-version-badge">
                    수정본 v{invoice.version}
                    {invoice.parentInvoiceId && (
                      <span className="parent-invoice-ref">
                        (원본: {invoice.parentInvoiceId})
                      </span>
                    )}
                  </div>
                )}
              </div>

            <div className="invoice-doc-body">
              <div className="invoice-parties">
                <div className="invoice-party">
                  <h3>공급자</h3>
                  <p className="party-name">{invoice.vendorName}</p>
                  <p className="party-info">{invoice.vendorAddress}</p>
                  <p className="party-info">TEL: {invoice.vendorPhone}</p>
                </div>
                <div className="invoice-party">
                  <h3>수요자</h3>
                  <p className="party-name">{invoice.hospitalName}</p>
                  <p className="party-info">{invoice.hospitalAddress}</p>
                </div>
              </div>

              <div className="invoice-meta">
                <div className="invoice-meta-item">
                  <span className="meta-label">명세서 번호:</span>
                  <span className="meta-value">{invoice.id}</span>
                </div>
                <div className="invoice-meta-item">
                  <span className="meta-label">발행일:</span>
                  <span className="meta-value">{format(new Date(invoice.date), 'yyyy년 MM월 dd일')}</span>
                </div>
              </div>

              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>품목명</th>
                    <th>수량</th>
                    <th>단가</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="item-name">{item.name}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{item.unitPrice.toLocaleString()}원</td>
                      <td className="item-total">{item.total.toLocaleString()}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-totals">
                <div className="invoice-total-row">
                  <span>소계</span>
                  <span>{invoice.subtotal.toLocaleString()}원</span>
                </div>
                <div className="invoice-total-row">
                  <span>부가세</span>
                  <span>{invoice.tax.toLocaleString()}원</span>
                </div>
                <div className="invoice-total-row total">
                  <span>합계</span>
                  <span>{invoice.total.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 액션 패널 */}
        <div className="invoice-action-panel">
          <div className="action-panel-section">
            <h3>서명</h3>
            <SignaturePad 
              onSave={handleSignatureSave}
              savedSignature={signature}
            />
            {signatureMetadata && (
              <div className="signature-info">
                <button 
                  className="btn-outline btn-small" 
                  onClick={() => setShowSignatureInfo(!showSignatureInfo)}
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  {showSignatureInfo ? '서명 정보 숨기기' : '서명 정보 보기'}
                </button>
                {showSignatureInfo && (
                  <div className="signature-metadata">
                    <div className="metadata-item">
                      <span className="metadata-label">서명 시각:</span>
                      <span className="metadata-value">
                        {format(new Date(signatureMetadata.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                      </span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">사용자:</span>
                      <span className="metadata-value">{signatureMetadata.userId}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">병원:</span>
                      <span className="metadata-value">{signatureMetadata.hospitalName}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">브라우저:</span>
                      <span className="metadata-value">
                        {signatureMetadata.browserName} {signatureMetadata.browserVersion}
                      </span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">운영체제:</span>
                      <span className="metadata-value">{signatureMetadata.os}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">IP 주소:</span>
                      <span className="metadata-value">{signatureMetadata.ipAddress}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">화면 해상도:</span>
                      <span className="metadata-value">{signatureMetadata.screenResolution}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">타임존:</span>
                      <span className="metadata-value">{signatureMetadata.timezone}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">접속 URL:</span>
                      <span className="metadata-value" style={{ fontSize: '11px' }}>
                        {signatureMetadata.url}
                      </span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">User Agent:</span>
                      <span className="metadata-value" style={{ fontSize: '11px' }} title={signatureMetadata.userAgent}>
                        {signatureMetadata.userAgent?.substring(0, 50)}...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="action-panel-section">
            <h3>액션</h3>
            <div className="action-buttons">
              <button 
                className="btn-primary action-btn-confirm" 
                onClick={handleConfirm}
                disabled={!signature}
              >
                확인 완료
              </button>
              <button 
                className="btn-outline action-btn-dispute" 
                onClick={() => setShowDisputeModal(true)}
              >
                이의 신청
              </button>
              <button 
                className="btn-secondary action-btn-download" 
                onClick={handleDownloadPDF}
              >
                PDF 다운로드
              </button>
            </div>
          </div>

          <div className="action-panel-section">
            <h3>명세서 정보</h3>
            <div className="invoice-info-list">
              <div className="info-item">
                <span className="info-label">총 품목 수</span>
                <span className="info-value">{invoice.items.length}개</span>
              </div>
              <div className="info-item">
                <span className="info-label">총 수량</span>
                <span className="info-value">{totalItems}개</span>
              </div>
              <div className="info-item">
                <span className="info-label">상태</span>
                <span className={`info-value status-${invoice.status}`}>
                  {invoice.status === 'unread' ? '미확인' : 
                   invoice.status === 'confirmed' ? '확인완료' : 
                   invoice.status === 'disputed' ? '이의신청' : invoice.status}
                </span>
              </div>
              {invoice.version > 1 && (
                <div className="info-item">
                  <span className="info-label">버전</span>
                  <span className="info-value">v{invoice.version}</span>
                </div>
              )}
            </div>

            {/* 수정 명세서 히스토리 */}
            {invoice.revisionHistory && invoice.revisionHistory.length > 0 && (
              <div className="revision-history">
                <h4 style={{ marginTop: '20px', marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
                  수정 이력
                </h4>
                {invoice.revisionHistory.map((history, idx) => (
                  <div key={idx} className="revision-history-item">
                    <div className="revision-version">v{history.version}</div>
                    <div className="revision-details">
                      <div className="revision-date">{format(new Date(history.date), 'yyyy-MM-dd')}</div>
                      <div className="revision-status status-{history.status}">
                        {history.status === 'disputed' ? '이의신청' : history.status}
                      </div>
                      {history.disputeReason && (
                        <div className="revision-reason">사유: {history.disputeReason}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 이의 신청 모달 */}
      {showDisputeModal && (
        <div className="modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>이의 신청</h2>
            <div className="modal-form">
              <label>이의 사유</label>
              <select 
                className="select-field" 
                value={disputeType} 
                onChange={e => setDisputeType(e.target.value)}
              >
                <option value="">선택하세요</option>
                <option value="quantity">수량 부족</option>
                <option value="damage">파손</option>
                <option value="wrong_item">품목 오류</option>
                <option value="price">단가 오류</option>
                <option value="other">기타</option>
              </select>

              <label>상세 메모</label>
              <textarea
                className="input-field"
                rows="4"
                value={disputeMemo}
                onChange={e => setDisputeMemo(e.target.value)}
                placeholder="이의 사유를 상세히 입력해주세요"
              />

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowDisputeModal(false)}>
                  취소
                </button>
                <button className="btn-primary" onClick={handleDispute}>
                  신청하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HospitalInvoice;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import SignaturePad from '../components/SignaturePad';
import signatureService from '../services/signatureService';
import API_BASE from '../api/baseUrl';
import authFetch from '../api/authFetch';
import { fetchInvoiceDetail, updateInvoiceStatus } from '../services/invoiceRecordService';
import '../css/HospitalInvoice.css';

const HospitalInvoice = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [signature, setSignature] = useState(null);
  const [signatureMetadata, setSignatureMetadata] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeType, setDisputeType] = useState('');
  const [disputeMemo, setDisputeMemo] = useState('');
  const [showSignatureInfo, setShowSignatureInfo] = useState(false);
  const [signatureSaving, setSignatureSaving] = useState(false);
  const [signatureError, setSignatureError] = useState('');
  const [invoiceError, setInvoiceError] = useState('');

  const loadInvoice = useCallback(() => {
    if (!invoiceId) {
      return;
    }

    setInvoiceError('');
    fetchInvoiceDetail(invoiceId)
      .then((data) => setInvoice(data))
      .catch((err) => {
        setInvoiceError(err.message || '명세서 정보를 불러오지 못했습니다.');
        setInvoice(null);
      });
  }, [invoiceId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  // 명세서 로드 후 서명 불러오기 (DB 우선, 없으면 캐시)
  useEffect(() => {
    if (!invoiceId) return;
    signatureService.loadSignature(invoiceId).then((saved) => {
      if (saved) {
        setSignature(saved.signatureData || saved.imageUrl || null);
        setSignatureMetadata(saved.metadata || null);
      }
    });
  }, [invoiceId]);

  const handleSignatureSave = async (signatureData) => {
    setSignatureSaving(true);
    setSignatureError('');
    try {
      const signatureRecord = await signatureService.saveSignature(invoiceId, signatureData);
      setSignature(signatureData);
      setSignatureMetadata(signatureRecord.metadata);
    } catch (err) {
      setSignatureError(err.message || '서명 저장 중 오류가 발생했습니다.');
    } finally {
      setSignatureSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!signature) {
      alert('서명을 먼저 저장해주세요.');
      return;
    }

    try {
      await updateInvoiceStatus(invoiceId, 'confirmed');
      alert('명세서가 확인되었습니다.');
      navigate('/hospital/inbox');
    } catch (err) {
      alert(err.message || '명세서 확인 처리에 실패했습니다.');
    }
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

    try {
      await updateInvoiceStatus(invoiceId, 'disputed', {
        note: `[${disputeType}] ${disputeMemo}`,
        disputeType,
        disputeMemo,
      });
      alert('이의 신청이 접수되었습니다. 도매업체에서 확인 후 수정 명세서를 발행합니다.');
      setShowDisputeModal(false);
      navigate('/hospital/inbox');
    } catch (err) {
      alert(err.message || '이의 신청 처리에 실패했습니다.');
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice?.pdfUrl) {
      alert('다운로드 가능한 PDF가 없습니다.');
      return;
    }

    const requestUrl = invoice.pdfUrl.startsWith('http')
      ? invoice.pdfUrl
      : `${API_BASE}${invoice.pdfUrl}`;
    const fileName = invoice.pdfUrl.split('/').pop() || `${invoice.id}.pdf`;

    authFetch(requestUrl)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error((await res.text()) || 'PDF 다운로드에 실패했습니다.');
        }
        return res.blob();
      })
      .then((blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
      })
      .catch((err) => {
        alert(err.message || 'PDF 다운로드에 실패했습니다.');
      });
  };

  if (invoiceError) {
    return <div className="invoice-loading">{invoiceError}</div>;
  }

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
                  <p className="party-info">{invoice.vendorAddress || '-'}</p>
                  <p className="party-info">TEL: {invoice.vendorPhone || '-'}</p>
                </div>
                <div className="invoice-party">
                  <h3>수요자</h3>
                  <p className="party-name">{invoice.hospitalName}</p>
                  <p className="party-info">{invoice.hospitalAddress || '-'}</p>
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
              savedSignature={typeof signature === 'string' ? signature : null}
            />
            {signatureSaving && (
              <p style={{ fontSize: 13, color: '#475BE8', marginTop: 8 }}>서명 저장 중...</p>
            )}
            {signatureError && (
              <p style={{ fontSize: 13, color: '#EF4444', marginTop: 8 }}>{signatureError}</p>
            )}
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
              {invoice.statusChangedAt && (
                <div className="info-item">
                  <span className="info-label">최종 처리 시각</span>
                  <span className="info-value">{format(new Date(invoice.statusChangedAt), 'yyyy-MM-dd HH:mm')}</span>
                </div>
              )}
              {invoice.processedByHospitalId && (
                <div className="info-item">
                  <span className="info-label">처리자 병원 ID</span>
                  <span className="info-value">{invoice.processedByHospitalId}</span>
                </div>
              )}
              {invoice.disputeType && (
                <div className="info-item">
                  <span className="info-label">이의 유형</span>
                  <span className="info-value">{invoice.disputeType}</span>
                </div>
              )}
              {invoice.disputeMemo && (
                <div className="info-item">
                  <span className="info-label">이의 메모</span>
                  <span className="info-value">{invoice.disputeMemo}</span>
                </div>
              )}
              {invoice.version > 1 && (
                <div className="info-item">
                  <span className="info-label">버전</span>
                  <span className="info-value">v{invoice.version}</span>
                </div>
              )}
            </div>

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

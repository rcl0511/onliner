import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HospitalInvoiceView from '../components/HospitalInvoiceView';
import signatureService from '../services/signatureService';
import { downloadInvoicePdf } from '../services/invoiceFileService';
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
    downloadInvoicePdf(invoice?.pdfUrl, invoice?.pdfUrl?.split('/').pop() || `${invoice.id}.pdf`)
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

  return (
    <>
      <HospitalInvoiceView
        invoice={invoice}
        signature={signature}
        signatureMetadata={signatureMetadata}
        signatureSaving={signatureSaving}
        signatureError={signatureError}
        showSignatureInfo={showSignatureInfo}
        setShowSignatureInfo={setShowSignatureInfo}
        onSaveSignature={handleSignatureSave}
        onConfirm={handleConfirm}
        onOpenDispute={() => setShowDisputeModal(true)}
        onDownloadPdf={handleDownloadPDF}
        onBack={() => navigate('/hospital/inbox')}
      />

      {showDisputeModal && (
        <div className="modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                className="textarea-field"
                value={disputeMemo}
                onChange={e => setDisputeMemo(e.target.value)}
                placeholder="구체적인 이의 내용을 입력해주세요..."
                rows={4}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDisputeModal(false)}>
                취소
              </button>
              <button className="btn-primary" onClick={handleDispute}>
                이의 신청하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HospitalInvoice;

import React from "react";
import { format } from "date-fns";
import SignaturePad from "./SignaturePad";

export default function HospitalInvoiceView({
  invoice,
  signature,
  signatureMetadata,
  signatureSaving,
  signatureError,
  showSignatureInfo,
  setShowSignatureInfo,
  onSaveSignature,
  onConfirm,
  onOpenDispute,
  onDownloadPdf,
  onBack,
}) {
  const totalItems = invoice.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="hospital-invoice-detail">
      <div className="invoice-header">
        <button className="btn-secondary" onClick={onBack}>
          ← 목록으로
        </button>
        <h1>명세서 상세</h1>
      </div>

      <div className="invoice-split-layout">
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
                  <p className="party-info">{invoice.vendorAddress || "-"}</p>
                  <p className="party-info">TEL: {invoice.vendorPhone || "-"}</p>
                </div>
                <div className="invoice-party">
                  <h3>수요자</h3>
                  <p className="party-name">{invoice.hospitalName}</p>
                  <p className="party-info">{invoice.hospitalAddress || "-"}</p>
                </div>
              </div>

              <div className="invoice-meta">
                <div className="invoice-meta-item">
                  <span className="meta-label">명세서 번호:</span>
                  <span className="meta-value">{invoice.id}</span>
                </div>
                <div className="invoice-meta-item">
                  <span className="meta-label">발행일:</span>
                  <span className="meta-value">
                    {format(new Date(invoice.date), "yyyy년 MM월 dd일")}
                  </span>
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
                      <td>
                        {item.quantity} {item.unit}
                      </td>
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

        <div className="invoice-action-panel">
          <div className="action-panel-section">
            <h3>서명</h3>
            <SignaturePad
              onSave={onSaveSignature}
              savedSignature={typeof signature === "string" ? signature : null}
            />
            {signatureSaving && (
              <p style={{ fontSize: 13, color: "#475BE8", marginTop: 8 }}>
                서명 저장 중...
              </p>
            )}
            {signatureError && (
              <p style={{ fontSize: 13, color: "#EF4444", marginTop: 8 }}>
                {signatureError}
              </p>
            )}
            {signatureMetadata && (
              <div className="signature-info">
                <button
                  className="btn-outline btn-small"
                  onClick={() => setShowSignatureInfo(!showSignatureInfo)}
                  style={{ marginTop: "12px", width: "100%" }}
                >
                  {showSignatureInfo ? "서명 정보 숨기기" : "서명 정보 보기"}
                </button>
                {showSignatureInfo && (
                  <div className="signature-metadata">
                    <div className="metadata-item">
                      <span className="metadata-label">서명 시각:</span>
                      <span className="metadata-value">
                        {format(
                          new Date(signatureMetadata.timestamp),
                          "yyyy-MM-dd HH:mm:ss"
                        )}
                      </span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">사용자:</span>
                      <span className="metadata-value">{signatureMetadata.userId}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">병원:</span>
                      <span className="metadata-value">
                        {signatureMetadata.hospitalName}
                      </span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">브라우저:</span>
                      <span className="metadata-value">
                        {signatureMetadata.browserName}{" "}
                        {signatureMetadata.browserVersion}
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
                      <span className="metadata-value">
                        {signatureMetadata.screenResolution}
                      </span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">타임존:</span>
                      <span className="metadata-value">{signatureMetadata.timezone}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">접속 URL:</span>
                      <span className="metadata-value" style={{ fontSize: "11px" }}>
                        {signatureMetadata.url}
                      </span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">User Agent:</span>
                      <span
                        className="metadata-value"
                        style={{ fontSize: "11px" }}
                        title={signatureMetadata.userAgent}
                      >
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
                onClick={onConfirm}
                disabled={!signature}
              >
                확인 완료
              </button>
              <button
                className="btn-outline action-btn-dispute"
                onClick={onOpenDispute}
              >
                이의 신청
              </button>
              <button
                className="btn-secondary action-btn-download"
                onClick={onDownloadPdf}
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
                <span className="info-value">{invoice.status}</span>
              </div>
              {invoice.revisionNote && (
                <div className="info-item">
                  <span className="info-label">수정 사유</span>
                  <span className="info-value">{invoice.revisionNote}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

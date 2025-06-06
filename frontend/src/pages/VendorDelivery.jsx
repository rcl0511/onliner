import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import '../css/VendorDelivery.css';

const VendorDelivery = () => {
  const location = useLocation();
  const { manual = [], auto = [] } = location.state || {};

  return (
    <div className="delivery-container">
      <h2 className="delivery-title">배송 관리</h2>
      <section className="delivery-section">
        {(manual.length > 0 || auto.length > 0) ? (
          <h3 className="section-heading">선택된 명세서</h3>
        ) : (
          <p>선택된 명세서가 없습니다.</p>
        )}
        <div className="cards-container">
          {manual.map((entry) => (
            <div key={entry.key} className="invoice-card">
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
          {auto.map((r) => {
            const filename = r.pdfUrl.split('/').pop();
            return (
              <div key={r.key} className="invoice-card">
                <div className="card-header auto-tag">자동</div>
                <div className="card-body">
                  <h4 className="card-title">{r.originalName}</h4>
                  <p className="card-row">
                    생성된 PDF:{' '}
                    <Link
                      to={r.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={filename}
                      className="pdf-download-link"
                    >
                      {filename}
                    </Link>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default VendorDelivery;

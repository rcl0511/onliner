import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from 'date-fns';
import '../css/HospitalDashboard.css';
import { fetchHospitalDashboard } from "../services/dashboardService";

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchHospitalDashboard()
      .then((data) => setStats(data))
      .catch(() => {
        setStats({
          unreadInvoices: 0,
          pendingPayments: 0,
          totalUnpaid: 0,
          recentInvoices: [],
        });
      });
  }, []);

  if (!stats) {
    return <div className="dashboard-loading">로딩 중...</div>;
  }

  return (
    <div className="hospital-dashboard">
      <h1>대시보드</h1>

      {/* 요약 카드 */}
      <div className="dashboard-summary-cards">
        <div className="dashboard-card" onClick={() => navigate('/hospital/inbox')}>
          <div className="dashboard-card-label">미확인 명세서</div>
          <div className="dashboard-card-value">{stats.unreadInvoices}건</div>
          <div className="dashboard-card-action">수신함으로 이동 →</div>
        </div>

        <div className="dashboard-card" onClick={() => navigate('/hospital/payment')}>
          <div className="dashboard-card-label">미결제 금액</div>
          <div className="dashboard-card-value">{stats.totalUnpaid.toLocaleString()}원</div>
          <div className="dashboard-card-action">결제 관리로 이동 →</div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-label">대기 중인 결제</div>
          <div className="dashboard-card-value">{stats.pendingPayments}건</div>
        </div>
      </div>

      {/* 최근 명세서 */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>최근 명세서</h2>
          <button className="btn-outline" onClick={() => navigate('/hospital/inbox')}>
            전체 보기
          </button>
        </div>
        <div className="dashboard-recent-list">
          {stats.recentInvoices.map((invoice) => (
            <div 
              key={invoice.id} 
              className="dashboard-recent-item"
              onClick={() => navigate(`/hospital/invoice/${invoice.id}`)}
            >
              <div className="recent-item-header">
                <span className="recent-item-id">{invoice.id}</span>
                <span className={`recent-item-status status-${invoice.status}`}>
                  {invoice.status === 'unread' ? '미확인' : '확인완료'}
                </span>
              </div>
              <div className="recent-item-info">
                <span className="recent-item-vendor">{invoice.vendorName}</span>
                <span className="recent-item-date">{format(new Date(invoice.date), 'yyyy-MM-dd')}</span>
                <span className="recent-item-amount">{invoice.amount.toLocaleString()}원</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

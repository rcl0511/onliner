import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import authStorage from '../services/authStorage';
import '../css/HospitalPayment.css';
import { createPaymentOrder, fetchHospitalPayments } from "../services/paymentService";

const STATUS_LABEL = { unpaid: '미결제', partial: '부분입금', paid: '완료', pending: '대기' };
const STATUS_CLASS = { unpaid: 'unpaid', partial: 'partial', paid: 'paid', pending: 'unpaid' };

export default function HospitalPayment() {
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const user = authStorage.getUser();
  const loadPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHospitalPayments();
      setSummary(data.summary);
      setPayments(data.payments || []);
    } catch {
      // fallback mock 데이터 (API 미연결 시)
      setSummary({ totalUnpaid: 0, monthlyExpected: 0, paidAmount: 0, overdueAmount: 0 });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  const handlePayment = async (payment) => {
    const clientKey = process.env.REACT_APP_TOSS_CLIENT_KEY;
    if (!clientKey) {
      alert('결제 설정이 완료되지 않았습니다. (REACT_APP_TOSS_CLIENT_KEY 환경변수 필요)');
      return;
    }

    try {
      // 결제 생성 (서버에 orderId 발급)
      const { orderId, amount } = await createPaymentOrder({
        invoiceRef: payment.id || payment.invoiceRef,
        amount: payment.amount,
      });

      // 토스페이먼츠 SDK 동적 로드
      if (!window.TossPayments) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://js.tosspayments.com/v1/payment';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const tossPayments = window.TossPayments(clientKey);
      await tossPayments.requestPayment('카드', {
        amount: Number(amount),
        orderId,
        orderName: `명세서 ${payment.invoiceRef || payment.id} 결제`,
        customerName: user.name || '병원',
        successUrl: `${window.location.origin}/hospital/payment/success`,
        failUrl: `${window.location.origin}/hospital/payment/fail`,
      });
    } catch (err) {
      if (err.code !== 'USER_CANCEL') {
        alert('결제 처리 중 오류가 발생했습니다: ' + (err.message || ''));
      }
    }
  };

  const filteredPayments = payments.filter((p) =>
    filterStatus === 'all' || p.status === filterStatus
  );

  if (loading) return <div className="payment-loading">로딩 중...</div>;

  return (
    <div className="hospital-payment">
      <h1>결제금액 관리</h1>

      {/* 미수금/정산 요약 위젯 */}
      {summary && (
        <div className="payment-summary-cards">
          <div className="summary-card unpaid">
            <div className="summary-card-content">
              <div className="summary-card-label">전체 미결제 금액</div>
              <div className="summary-card-value">{Number(summary.totalUnpaid).toLocaleString()}원</div>
            </div>
          </div>
          <div className="summary-card expected">
            <div className="summary-card-content">
              <div className="summary-card-label">당월 결제 예정액</div>
              <div className="summary-card-value">{Number(summary.monthlyExpected).toLocaleString()}원</div>
            </div>
          </div>
          <div className="summary-card paid">
            <div className="summary-card-content">
              <div className="summary-card-label">입금 완료 금액</div>
              <div className="summary-card-value">{Number(summary.paidAmount).toLocaleString()}원</div>
            </div>
          </div>
          <div className="summary-card overdue">
            <div className="summary-card-content">
              <div className="summary-card-label">연체 금액</div>
              <div className="summary-card-value">{Number(summary.overdueAmount).toLocaleString()}원</div>
            </div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="payment-actions">
        <div className="payment-filters">
          <div className="filter-group">
            <label>결제 상태</label>
            <select className="select-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">전체</option>
              <option value="unpaid">미결제</option>
              <option value="partial">부분입금</option>
              <option value="paid">완료</option>
            </select>
          </div>
        </div>
      </div>

      {/* 결제 내역 테이블 */}
      <div className="payment-details">
        {filteredPayments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
            {payments.length === 0 ? '결제 내역이 없습니다.' : '해당 조건의 결제 내역이 없습니다.'}
          </div>
        ) : (
          <table className="table payment-table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>명세서 참조</th>
                <th>금액</th>
                <th>결제 상태</th>
                <th>결제 수단</th>
                <th>생성일</th>
                <th>승인일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{payment.id}</td>
                  <td>{payment.invoiceRef || '-'}</td>
                  <td className="total-amount">{Number(payment.amount).toLocaleString()}원</td>
                  <td>
                    <span className={`payment-status status-${STATUS_CLASS[payment.status] || 'unpaid'}`}>
                      {STATUS_LABEL[payment.status] || payment.status}
                    </span>
                  </td>
                  <td>{payment.method || '-'}</td>
                  <td>{payment.createdAt ? format(new Date(payment.createdAt), 'yyyy-MM-dd') : '-'}</td>
                  <td>{payment.approvedAt ? format(new Date(payment.approvedAt), 'yyyy-MM-dd') : '-'}</td>
                  <td>
                    {payment.status !== 'paid' && (
                      <button className="btn-primary btn-small" onClick={() => handlePayment(payment)}>
                        결제하기
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

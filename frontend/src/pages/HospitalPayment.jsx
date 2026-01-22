import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import '../css/HospitalPayment.css';

export default function HospitalPayment() {
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = () => {
    // 임시 데이터
    const mockSummary = {
      totalUnpaid: 3250000,
      monthlyExpected: 2100000,
      paidAmount: 1150000,
      overdueAmount: 500000,
    };

    const mockPayments = [
      {
        id: 'PAY-001',
        invoiceId: 'INV-2024-001',
        vendorName: 'DH약품',
        vendorCode: 'dh-pharm',
        transactionDate: '2024-01-15',
        itemsSummary: '타이레놀 외 14건',
        subtotal: 1136364,
        tax: 113636,
        total: 1250000,
        status: 'unpaid', // unpaid, partial, paid
        paidAmount: 0,
        dueDate: '2024-02-15',
        paymentMethod: null,
      },
      {
        id: 'PAY-002',
        invoiceId: 'INV-2024-002',
        vendorName: '서울제약',
        vendorCode: 'seoul-pharm',
        transactionDate: '2024-01-14',
        itemsSummary: '아스피린 외 11건',
        subtotal: 890909,
        tax: 89091,
        total: 980000,
        status: 'partial',
        paidAmount: 500000,
        dueDate: '2024-02-14',
        paymentMethod: 'virtual_account',
      },
      {
        id: 'PAY-003',
        invoiceId: 'INV-2024-003',
        vendorName: 'DH약품',
        vendorCode: 'dh-pharm',
        transactionDate: '2024-01-13',
        itemsSummary: '게보린정 외 24건',
        subtotal: 1909091,
        tax: 190909,
        total: 2100000,
        status: 'paid',
        paidAmount: 2100000,
        dueDate: '2024-02-13',
        paymentMethod: 'bank_transfer',
        paidDate: '2024-01-20',
      },
      {
        id: 'PAY-004',
        invoiceId: 'INV-2024-004',
        vendorName: '대한제약',
        vendorCode: 'daehan-pharm',
        transactionDate: '2024-01-12',
        itemsSummary: '판콜에이 외 7건',
        subtotal: 681818,
        tax: 68182,
        total: 750000,
        status: 'unpaid',
        paidAmount: 0,
        dueDate: '2024-02-12',
        paymentMethod: null,
        isOverdue: true,
      },
    ];

    setSummary(mockSummary);
    setPayments(mockPayments);
  };

  const filteredPayments = payments.filter(payment => {
    if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
    if (filterVendor !== 'all' && payment.vendorCode !== filterVendor) return false;
    return true;
  });

  const handleDownloadAll = () => {
    // 증빙 서류 일괄 다운로드
    alert('증빙 서류 일괄 다운로드 기능은 준비 중입니다.');
  };

  const handleDownloadInvoice = (invoiceId) => {
    // 개별 명세서 다운로드
    alert(`명세서 ${invoiceId} 다운로드`);
  };

  const handlePayment = async (payment) => {
    // 결제 처리
    // 실제로는 결제 API 연동 필요 (예: 토스페이먼츠, 이니시스, KG이니시스 등)
    
    // 예시: 토스페이먼츠 연동 구조
    /*
    const paymentData = {
      amount: payment.total,
      orderId: payment.id,
      orderName: `${payment.vendorName} 명세서 ${payment.invoiceId}`,
      customerName: '병원명',
      successUrl: `${window.location.origin}/hospital/payment/success`,
      failUrl: `${window.location.origin}/hospital/payment/fail`,
    };

    // 토스페이먼츠 결제창 호출
    const { TossPayments } = window;
    const tossPayments = TossPayments('가맹점키');
    await tossPayments.requestPayment('카드', {
      amount: paymentData.amount,
      orderId: paymentData.orderId,
      orderName: paymentData.orderName,
      customerName: paymentData.customerName,
      successUrl: paymentData.successUrl,
      failUrl: paymentData.failUrl,
    });
    */

    // 임시: 결제 시뮬레이션
    if (window.confirm(`${payment.total.toLocaleString()}원을 결제하시겠습니까?`)) {
      // 실제로는 서버 API 호출
      // await fetch('/api/payments/process', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     paymentId: payment.id,
      //     amount: payment.total,
      //     method: 'card' // card, bank_transfer, virtual_account 등
      //   })
      // });
      
      alert('결제가 완료되었습니다. (실제 결제 연동 필요)');
      loadPaymentData(); // 데이터 새로고침
    }
  };

  const vendors = [...new Set(payments.map(p => ({ code: p.vendorCode, name: p.vendorName })))];

  if (!summary) {
    return <div className="payment-loading">로딩 중...</div>;
  }

  return (
    <div className="hospital-payment">
      <h1>결제금액 관리</h1>

      {/* 미수금/정산 요약 위젯 */}
      <div className="payment-summary-cards">
        <div className="summary-card unpaid">
          <div className="summary-card-content">
            <div className="summary-card-label">전체 미결제 금액</div>
            <div className="summary-card-value">{summary.totalUnpaid.toLocaleString()}원</div>
          </div>
        </div>

        <div className="summary-card expected">
          <div className="summary-card-content">
            <div className="summary-card-label">당월 결제 예정액</div>
            <div className="summary-card-value">{summary.monthlyExpected.toLocaleString()}원</div>
          </div>
        </div>

        <div className="summary-card paid">
          <div className="summary-card-content">
            <div className="summary-card-label">입금 완료 금액</div>
            <div className="summary-card-value">{summary.paidAmount.toLocaleString()}원</div>
          </div>
        </div>

        <div className="summary-card overdue">
          <div className="summary-card-content">
            <div className="summary-card-label">연체 금액</div>
            <div className="summary-card-value">{summary.overdueAmount.toLocaleString()}원</div>
          </div>
        </div>
      </div>

      {/* 필터 및 액션 */}
      <div className="payment-actions">
        <div className="payment-filters">
          <div className="filter-group">
            <label>결제 상태</label>
            <select 
              className="select-field" 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="unpaid">미결제</option>
              <option value="partial">부분입금</option>
              <option value="paid">완료</option>
            </select>
          </div>

          <div className="filter-group">
            <label>도매업체</label>
            <select 
              className="select-field" 
              value={filterVendor} 
              onChange={e => setFilterVendor(e.target.value)}
            >
              <option value="all">전체</option>
              {vendors.map(v => (
                <option key={v.code} value={v.code}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn-primary" onClick={handleDownloadAll}>
          증빙 서류 일괄 다운로드
        </button>
      </div>

      {/* 상세 내역 테이블 */}
      <div className="payment-details">
        <table className="table payment-table">
          <thead>
            <tr>
              <th>거래일자</th>
              <th>명세서 번호</th>
              <th>도매업체명</th>
              <th>품목 요약</th>
              <th>공급가액</th>
              <th>부가세</th>
              <th>합계</th>
              <th>결제 상태</th>
              <th>납기일</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty-state">결제 내역이 없습니다.</td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className={payment.isOverdue ? 'overdue-row' : ''}>
                  <td>{format(new Date(payment.transactionDate), 'yyyy-MM-dd')}</td>
                  <td>
                    <span className="invoice-id-link">{payment.invoiceId}</span>
                  </td>
                  <td>{payment.vendorName}</td>
                  <td className="items-summary">{payment.itemsSummary}</td>
                  <td>{payment.subtotal.toLocaleString()}원</td>
                  <td>{payment.tax.toLocaleString()}원</td>
                  <td className="total-amount">{payment.total.toLocaleString()}원</td>
                  <td>
                    <span className={`payment-status status-${payment.status}`}>
                      {payment.status === 'unpaid' ? '미결제' : 
                       payment.status === 'partial' ? '부분입금' : '완료'}
                    </span>
                    {payment.status === 'partial' && (
                      <div className="partial-info">
                        ({payment.paidAmount.toLocaleString()}원 입금)
                      </div>
                    )}
                  </td>
                  <td className={payment.isOverdue ? 'overdue-date' : ''}>
                    {format(new Date(payment.dueDate), 'yyyy-MM-dd')}
                    {payment.isOverdue && <span className="overdue-indicator"> (연체)</span>}
                  </td>
                  <td>
                    <div className="payment-actions-cell">
                      <button 
                        className="btn-outline btn-small"
                        onClick={() => handleDownloadInvoice(payment.invoiceId)}
                      >
                        다운로드
                      </button>
                      {payment.status !== 'paid' && (
                        <button 
                          className="btn-primary btn-small" 
                          style={{ marginLeft: '8px' }}
                          onClick={() => handlePayment(payment)}
                        >
                          결제하기
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

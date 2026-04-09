import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPayment } from "../services/paymentService";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('confirming'); // confirming | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setErrorMsg('결제 정보가 올바르지 않습니다. (paymentKey / orderId / amount 누락)');
      setStatus('error');
      return;
    }

    confirmPayment({ paymentKey, orderId, amount })
      .then(() => setStatus('success'))
      .catch((err) => {
        setErrorMsg(err.message || '결제 승인에 실패했습니다.');
        setStatus('error');
      });
  }, [searchParams]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ background: 'white', padding: 48, borderRadius: 16, textAlign: 'center', maxWidth: 400, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {status === 'confirming' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2 style={{ color: '#1E293B', marginBottom: 8 }}>결제 확인 중...</h2>
            <p style={{ color: '#64748B' }}>잠시만 기다려주세요.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#10B981', marginBottom: 8 }}>결제 완료</h2>
            <p style={{ color: '#64748B', marginBottom: 24 }}>결제가 성공적으로 처리되었습니다.</p>
            <button
              onClick={() => navigate('/hospital/payment')}
              style={{ padding: '12px 32px', background: '#475BE8', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}
            >
              결제 내역으로 이동
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: '#EF4444', marginBottom: 8 }}>결제 실패</h2>
            <p style={{ color: '#64748B', marginBottom: 24 }}>{errorMsg}</p>
            <button
              onClick={() => navigate('/hospital/payment')}
              style={{ padding: '12px 32px', background: '#475BE8', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}
            >
              결제 내역으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

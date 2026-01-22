# 결제 연동 가이드

## 개요
병원용 결제 시스템에 실제 결제 API를 연동하는 방법입니다.

## 지원 가능한 결제 대행사

### 1. 토스페이먼츠 (추천)
- 공식 문서: https://docs.tosspayments.com/
- 지원 결제 수단: 카드, 계좌이체, 가상계좌, 휴대폰 소액결제

### 2. 이니시스 (KG이니시스)
- 공식 문서: https://www.inicis.com/
- 지원 결제 수단: 카드, 계좌이체, 가상계좌, 휴대폰 소액결제

### 3. 나이스페이
- 공식 문서: https://www.nicepay.co.kr/
- 지원 결제 수단: 카드, 계좌이체, 가상계좌

## 구현 방법

### 1. 토스페이먼츠 연동 예시

```javascript
// 1. HTML에 스크립트 추가 (public/index.html)
<script src="https://js.tosspayments.com/v1/payment"></script>

// 2. 결제 처리 함수 (HospitalPayment.jsx)
const handlePayment = async (payment) => {
  const { TossPayments } = window;
  const tossPayments = TossPayments('가맹점키'); // 실제 가맹점 키로 교체

  try {
    await tossPayments.requestPayment('카드', {
      amount: payment.total,
      orderId: payment.id,
      orderName: `${payment.vendorName} 명세서 ${payment.invoiceId}`,
      customerName: '병원명',
      successUrl: `${window.location.origin}/hospital/payment/success`,
      failUrl: `${window.location.origin}/hospital/payment/fail`,
    });
  } catch (error) {
    console.error('결제 실패:', error);
    alert('결제에 실패했습니다.');
  }
};
```

### 2. 서버 사이드 검증 (필수)

결제 완료 후 서버에서 실제 결제 검증이 필요합니다:

```javascript
// 서버 API 예시
POST /api/payments/verify
{
  "paymentKey": "토스페이먼츠에서 받은 paymentKey",
  "orderId": "주문 ID",
  "amount": "결제 금액"
}
```

### 3. 결제 성공/실패 페이지

```javascript
// pages/HospitalPaymentSuccess.jsx
import { useSearchParams } from 'react-router-dom';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // 서버에 결제 검증 요청
    verifyPayment(paymentKey, orderId);
  }, []);

  return <div>결제가 완료되었습니다.</div>;
}
```

## 보안 고려사항

1. **가맹점 키 관리**: 환경 변수로 관리하고 절대 클라이언트에 노출하지 않음
2. **서버 검증**: 모든 결제는 서버에서 검증 필수
3. **HTTPS**: 결제 페이지는 반드시 HTTPS 사용
4. **금액 검증**: 클라이언트에서 보낸 금액을 서버에서 재검증

## 환경 변수 설정

```env
REACT_APP_TOSS_CLIENT_KEY=가맹점_클라이언트_키
REACT_APP_PAYMENT_API_URL=https://api.yourserver.com/payments
```

## 참고사항

- 실제 운영 환경에서는 서버 사이드에서 결제 처리 권장
- PCI DSS 규정 준수 필요
- 결제 로그는 법적 증빙을 위해 안전하게 보관

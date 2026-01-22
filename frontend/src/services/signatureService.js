import invoiceStatusService from "./invoiceStatusService";
import authStorage from "./authStorage";

// 서명 서비스 - 명세서별 개별 서명 관리 및 메타데이터 수집
class SignatureService {
  // 브라우저 정보 파싱
  parseBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    let os = 'Unknown';

    // 브라우저 감지
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
      browserName = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      browserName = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('Edg') > -1) {
      browserName = 'Edge';
      const match = ua.match(/Edg\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
      browserName = 'Internet Explorer';
      const match = ua.match(/(?:MSIE |rv:)(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }

    // OS 감지
    if (ua.indexOf('Win') > -1) os = 'Windows';
    else if (ua.indexOf('Mac') > -1) os = 'macOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

    return {
      browserName,
      browserVersion,
      os,
      fullUserAgent: ua
    };
  }

  // IP 주소 수집 (외부 API 사용)
  async getIPAddress() {
    try {
      // 방법 1: ipify API 사용
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      try {
        // 방법 2: ipapi.co 사용
        const response = await fetch('https://ipapi.co/ip/');
        const ip = await response.text();
        return ip.trim();
      } catch (error2) {
        console.warn('IP 주소 수집 실패:', error2);
        // 실제 운영 환경에서는 서버에서 IP를 수집해야 함
        return '서버에서 수집 필요';
      }
    }
  }

  // 서명 메타데이터 수집
  async collectMetadata() {
    const browserInfo = this.parseBrowserInfo();
    const ipAddress = await this.getIPAddress();
    
    const metadata = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      browserName: browserInfo.browserName,
      browserVersion: browserInfo.browserVersion,
      os: browserInfo.os,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      ipAddress: ipAddress,
      // 추가 법적 증빙 정보
      referrer: document.referrer || '직접 접속',
      url: window.location.href,
    };

    return metadata;
  }

  // 명세서별 서명 저장
  async saveSignature(invoiceId, signatureData) {
    const metadata = await this.collectMetadata();
    
    const signatureRecord = {
      invoiceId,
      signatureData, // base64 이미지
      metadata: {
        ...metadata,
        userId: this.getUserId(),
        hospitalName: this.getHospitalName(),
      },
      version: 1, // 수정 명세서 버전 관리
    };

    // 로컬 스토리지에 명세서별로 저장
    const key = `invoice_signature_${invoiceId}`;
    localStorage.setItem(key, JSON.stringify(signatureRecord));

    // 서명 저장 시 명세서 상태를 확인완료로 변경
    invoiceStatusService.setStatus(invoiceId, "confirmed");

    // 실제로는 서버 API 호출
    // await fetch('/api/invoices/signature', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(signatureRecord)
    // });

    return signatureRecord;
  }

  // 명세서별 서명 불러오기
  getSignature(invoiceId) {
    const key = `invoice_signature_${invoiceId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const record = JSON.parse(stored);
      return {
        signatureData: record.signatureData,
        metadata: record.metadata,
        version: record.version,
      };
    }

    return null;
  }

  // 서명 메타데이터 조회
  getSignatureMetadata(invoiceId) {
    const signature = this.getSignature(invoiceId);
    return signature ? signature.metadata : null;
  }

  // 사용자 정보 가져오기
  getUserId() {
    try {
      const userInfo = authStorage.getUser();
      return userInfo.phone || userInfo.email || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  getHospitalName() {
    try {
      const userInfo = authStorage.getUser();
      return userInfo.hospitalName || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // 서명 삭제 (이의 신청 시)
  deleteSignature(invoiceId) {
    const key = `invoice_signature_${invoiceId}`;
    localStorage.removeItem(key);
  }
}

const signatureService = new SignatureService();

export default signatureService;

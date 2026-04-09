import authStorage from "./authStorage";
import { http } from "../api/http";

// 서명 서비스 - 명세서별 개별 서명 관리 및 메타데이터 수집
class SignatureService {
  // 브라우저 정보 파싱
  parseBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    let os = 'Unknown';

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

    if (ua.indexOf('Win') > -1) os = 'Windows';
    else if (ua.indexOf('Mac') > -1) os = 'macOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

    return { browserName, browserVersion, os, fullUserAgent: ua };
  }

  // IP 주소 수집 (외부 API 사용)
  async getIPAddress() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      try {
        const response = await fetch('https://ipapi.co/ip/');
        const ip = await response.text();
        return ip.trim();
      } catch {
        return '서버에서 수집 필요';
      }
    }
  }

  // 서명 메타데이터 수집
  async collectMetadata() {
    const browserInfo = this.parseBrowserInfo();
    const ipAddress = await this.getIPAddress();

    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      browserName: browserInfo.browserName,
      browserVersion: browserInfo.browserVersion,
      os: browserInfo.os,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      ipAddress,
      referrer: document.referrer || '직접 접속',
      url: window.location.href,
      userId: this.getUserId(),
      hospitalName: this.getHospitalName(),
    };
  }

  // 명세서별 서명 저장 (DB + Supabase Storage)
  async saveSignature(invoiceId, signatureData) {
    const metadata = await this.collectMetadata();
    const { data: result } = await http.post(`/api/invoices/${invoiceId}/signature`, {
        imageDataUrl: signatureData,
        metadata: JSON.stringify(metadata),
    });

    // 로컬 캐시 (오프라인 fallback 및 빠른 UI 복원)
    const key = `invoice_signature_${invoiceId}`;
    localStorage.setItem(key, JSON.stringify({ signatureData, metadata, imageUrl: result.imageUrl }));

    return { ...result, metadata };
  }

  // 명세서별 서명 불러오기 (DB 우선, 없으면 로컬 캐시)
  async loadSignature(invoiceId) {
    try {
      const { data } = await http.get(`/api/invoices/${invoiceId}/signature`);
      let metadata = {};
      try { metadata = JSON.parse(data.metadata || '{}'); } catch {}
      return {
        signatureData: data.imageDataUrl || null,
        imageUrl: data.imageUrl || data.imageDataUrl || null,
        metadata,
        signedAt: data.signedAt,
      };
    } catch {}

    // fallback: 로컬 캐시
    return this.getSignatureFromCache(invoiceId);
  }

  getSignatureFromCache(invoiceId) {
    const key = `invoice_signature_${invoiceId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return null;
  }

  // 하위 호환 동기 메서드 (HospitalInvoice에서 사용 중)
  getSignature(invoiceId) {
    return this.getSignatureFromCache(invoiceId);
  }

  getSignatureMetadata(invoiceId) {
    const sig = this.getSignatureFromCache(invoiceId);
    return sig ? sig.metadata : null;
  }

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

  deleteSignature(invoiceId) {
    localStorage.removeItem(`invoice_signature_${invoiceId}`);
  }
}

const signatureService = new SignatureService();
export default signatureService;

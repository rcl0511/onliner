// 알림 서비스
class NotificationService {
  constructor() {
    this.permission = null;
    this.init();
  }

  async init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      
      // 권한이 없으면 요청
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }
    }
  }

  // 푸시 알림 전송
  async sendNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.warn('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    if (this.permission !== 'granted') {
      this.permission = await Notification.requestPermission();
    }

    if (this.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'invoice-notification',
        requireInteraction: false,
        ...options
      });

      // 알림 클릭 시 처리
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (options.url) {
          window.open(options.url, '_blank');
        }
        
        notification.close();
      };

      // 자동 닫기 (5초 후)
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
  }

  // 새 명세서 도착 알림
  notifyNewInvoice(invoiceId, vendorName) {
    return this.sendNotification('새로운 명세서가 도착했습니다', {
      body: `${vendorName}에서 명세서를 발행했습니다.`,
      url: `/hospital/invoice/${invoiceId}`,
      data: { invoiceId, vendorName }
    });
  }

  // 명세서 확인 요청 알림
  notifyInvoiceReminder(invoiceId, vendorName) {
    return this.sendNotification('확인 대기 중인 명세서가 있습니다', {
      body: `${vendorName}의 명세서를 확인해주세요.`,
      url: `/hospital/invoice/${invoiceId}`,
      data: { invoiceId, vendorName }
    });
  }
}

// 싱글톤 인스턴스
const notificationService = new NotificationService();

export default notificationService;

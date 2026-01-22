import API_BASE from "../api/baseUrl";
import authStorage from "./authStorage";

const toWebSocketUrl = (baseUrl) => {
  if (baseUrl.startsWith("https://")) {
    return baseUrl.replace("https://", "wss://");
  }
  if (baseUrl.startsWith("http://")) {
    return baseUrl.replace("http://", "ws://");
  }
  return baseUrl;
};

class WsChatService {
  constructor() {
    this.socket = null;
    this.handlers = new Set();
    this.reconnectTimer = null;
    this.retryCount = 0;
    this.currentRoom = null;
    this.token = null;
  }

  buildToken() {
    const user = authStorage.getUser();
    if (!user || !user.role) return "";
    if (user.role === "hospital") {
      return `hospital:${user.hospitalId || "hospital-snu"}`;
    }
    if (user.role === "vendor") {
      return `vendor:${user.companyCode || "dh-pharm"}`;
    }
    return "";
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const wsBase = toWebSocketUrl(API_BASE);
    const token = this.buildToken();
    this.token = token;
    const url = `${wsBase}/ws/chat?token=${encodeURIComponent(token)}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.retryCount = 0;
      if (this.currentRoom) {
        this.send({ type: "subscribe", roomId: this.currentRoom });
      }
    };

    this.socket.onmessage = (event) => {
      const payload = this.parseMessage(event.data);
      if (!payload) return;
      this.handlers.forEach((handler) => handler(payload));
    };

    this.socket.onclose = () => {
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.scheduleReconnect();
    };
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(5000, 500 * (this.retryCount + 1));
    this.retryCount += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  parseMessage(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return { type: "chat", message: String(raw) };
    }
  }

  subscribe(handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  joinRoom(roomId) {
    if (!roomId) return;
    if (this.currentRoom && this.currentRoom !== roomId) {
      this.send({ type: "unsubscribe", roomId: this.currentRoom });
    }
    this.currentRoom = roomId;
    this.send({ type: "subscribe", roomId });
  }

  leaveRoom(roomId) {
    if (!roomId) return;
    if (this.currentRoom === roomId) {
      this.currentRoom = null;
    }
    this.send({ type: "unsubscribe", roomId });
  }

  send(payload) {
    this.connect();
    const message = typeof payload === "string" ? payload : JSON.stringify(payload);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(message);
        }
      }, 300);
    }
  }
}

const wsChatService = new WsChatService();
export default wsChatService;

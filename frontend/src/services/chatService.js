import API_BASE from "../api/baseUrl";
import authStorage from "./authStorage";

const CHAT_PREFIX = "chat_messages";

class ChatService {
  getChatKey({ invoiceId, selfId, otherId }) {
    const participants = [selfId || "unknown", otherId || "unknown"].sort().join("_");
    const context = invoiceId ? `invoice_${invoiceId}` : "general";
    return `${CHAT_PREFIX}_${context}_${participants}`;
  }

  async fetchHistory(roomId) {
    const token = authStorage.getToken();
    if (!token) return [];
    try {
      const res = await fetch(`${API_BASE}/api/chat/${encodeURIComponent(roomId)}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return this._getLocal(roomId);
      return await res.json();
    } catch {
      return this._getLocal(roomId);
    }
  }

  // localStorage fallback (render-nodb 모드 또는 네트워크 오류 시)
  _getLocal(roomId) {
    try {
      return JSON.parse(localStorage.getItem(roomId) || "[]");
    } catch {
      return [];
    }
  }

  saveLocalMessage(roomId, message) {
    const current = this._getLocal(roomId);
    localStorage.setItem(roomId, JSON.stringify([...current, message]));
  }
}

const chatService = new ChatService();
export default chatService;

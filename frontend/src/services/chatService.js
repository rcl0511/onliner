const CHAT_PREFIX = "chat_messages";

class ChatService {
  getChatKey({ invoiceId, selfId, otherId }) {
    const participants = [selfId || "unknown", otherId || "unknown"].sort().join("_");
    const context = invoiceId ? `invoice_${invoiceId}` : "general";
    return `${CHAT_PREFIX}_${context}_${participants}`;
  }

  getMessages(chatKey) {
    try {
      return JSON.parse(localStorage.getItem(chatKey) || "[]");
    } catch {
      return [];
    }
  }

  saveMessage(chatKey, message) {
    const current = this.getMessages(chatKey);
    const next = [...current, message];
    localStorage.setItem(chatKey, JSON.stringify(next));
  }
}

const chatService = new ChatService();
export default chatService;

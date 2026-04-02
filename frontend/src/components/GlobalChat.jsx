import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import '../css/GlobalChat.css';
import chatService from "../services/chatService";
import authStorage from "../services/authStorage";
import wsChatService from "../services/wsChatService";

const GlobalChat = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentContext, setCurrentContext] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [readStatus, setReadStatus] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const user = authStorage.getUser();
  const isHospital = user.role === 'hospital';
  const isVendor = user.role === 'vendor';

  const getSelfId = useCallback(() => {
    if (isHospital) return `hospital_${user.hospitalId || "hospital-snu"}`;
    if (isVendor) return `vendor_${user.companyCode || "dh-pharm"}`;
    return "guest";
  }, [isHospital, isVendor, user.companyCode, user.hospitalId]);

  const getContactSelfId = useCallback((contactId) => {
    if (!contactId) return "unknown";
    if (isHospital) return `vendor_${contactId}`;
    return `hospital_${contactId}`;
  }, [isHospital]);

  const contacts = useMemo(() => {
    if (isHospital) {
      return [
        { id: "dh-pharm", name: "DH약품", subtitle: "도매업체" },
        { id: "seoul-pharm", name: "서울제약", subtitle: "도매업체" },
        { id: "daehan-pharm", name: "대한제약", subtitle: "도매업체" },
      ];
    }
    return [
      { id: "hospital-snu", name: "서울대학교병원", subtitle: "병원" },
      { id: "hospital-seoul", name: "서울병원", subtitle: "병원" },
      { id: "hospital-daehan", name: "대한병원", subtitle: "병원" },
    ];
  }, [isHospital]);

  const chatKey = useMemo(() => {
    if (!selectedContactId || !currentContext) return '';
    return chatService.getChatKey({
      invoiceId: currentContext?.type === 'invoice' ? currentContext.invoiceId : null,
      selfId: getSelfId(),
      otherId: getContactSelfId(selectedContactId)
    });
  }, [selectedContactId, currentContext, getContactSelfId, getSelfId]);

  // 채팅방 전환 또는 열릴 때 히스토리 로드
  useEffect(() => {
    if (!chatKey) return;
    setIsLoadingHistory(true);
    chatService.fetchHistory(chatKey).then((history) => {
      setMessages(history);
      setUnreadCount(0);
      setIsLoadingHistory(false);
    });
  }, [chatKey]);

  useEffect(() => {
    if (!selectedContactId && contacts.length > 0) {
      setSelectedContactId(contacts[0].id);
    }
  }, [contacts, selectedContactId]);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/invoice/')) {
      const invoiceId = path.split('/invoice/')[1]?.split('?')[0];
      if (invoiceId) {
        setCurrentContext({ type: 'invoice', invoiceId, title: `명세서 ${invoiceId}` });
      }
    } else {
      setCurrentContext({ type: 'general', title: isHospital ? '도매업체 문의' : '병원 문의' });
    }
  }, [location, isHospital]);

  // WebSocket 수신
  useEffect(() => {
    if (!chatKey) return;
    wsChatService.connect();
    wsChatService.joinRoom(chatKey);
    const unsubscribe = wsChatService.subscribe((payload) => {
      if (payload?.roomId && payload.roomId !== chatKey) return;
      if (payload?.type === "read") {
        setReadStatus({
          readerId: payload.readerId,
          lastReadId: payload.lastReadId,
          timestamp: payload.serverTimestamp || payload.timestamp,
        });
        return;
      }
      if (payload?.type && payload.type !== "chat") return;

      const incoming = {
        id: payload.dbId || payload.id || payload.clientMessageId || Date.now(),
        sender: payload.sender || "unknown",
        senderName: payload.senderName || "상대방",
        message: payload.message || "",
        timestamp: payload.serverTimestamp || payload.timestamp || new Date().toISOString(),
        messageType: payload.messageType || "text",
      };
      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === String(incoming.id))) return prev;
        return [...prev, incoming];
      });
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    });
    return () => unsubscribe();
  }, [chatKey, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 타이핑 감지 (같은 탭 내 폴백)
  useEffect(() => {
    if (!chatKey) return;
    const interval = setInterval(() => {
      const typing = localStorage.getItem(`chat_typing_${chatKey}`) === "1";
      setIsTyping(typing);
    }, 1000);
    return () => clearInterval(interval);
  }, [chatKey]);

  // 읽음 처리
  useEffect(() => {
    if (!isOpen || !chatKey || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    wsChatService.send({
      type: "read",
      roomId: chatKey,
      lastReadId: lastMessage.id,
      timestamp: new Date().toISOString(),
    });
  }, [isOpen, chatKey, messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatKey) return;

    const clientId = `local_${Date.now()}`;
    const message = {
      id: clientId,
      sender: isHospital ? 'hospital' : 'vendor',
      senderName: isHospital ? (user.name || '병원 담당자') : (user.companyName || '도매업체'),
      message: newMessage,
      timestamp: new Date().toISOString(),
      messageType: 'text',
    };

    // 낙관적 UI 업데이트
    setMessages((prev) => [...prev, message]);
    setNewMessage('');

    // localStorage fallback 저장
    chatService.saveLocalMessage(chatKey, message);

    // WebSocket 전송 (서버에서 DB 저장 후 브로드캐스트)
    wsChatService.send({
      type: "chat",
      roomId: chatKey,
      id: clientId,
      sender: message.sender,
      senderName: message.senderName,
      message: message.message,
      timestamp: message.timestamp,
      messageType: "text",
    });
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (chatKey) {
      localStorage.setItem(`chat_typing_${chatKey}`, "1");
      setTimeout(() => localStorage.setItem(`chat_typing_${chatKey}`, "0"), 1200);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !chatKey) return;

    const clientId = `local_file_${Date.now()}`;
    const fileMessage = {
      id: clientId,
      sender: isHospital ? 'hospital' : 'vendor',
      senderName: isHospital ? (user.name || '병원 담당자') : (user.companyName || '도매업체'),
      message: file.name,
      timestamp: new Date().toISOString(),
      messageType: 'file',
    };

    setMessages((prev) => [...prev, fileMessage]);
    chatService.saveLocalMessage(chatKey, fileMessage);
    wsChatService.send({
      type: "chat",
      roomId: chatKey,
      id: clientId,
      sender: fileMessage.sender,
      senderName: fileMessage.senderName,
      message: fileMessage.message,
      timestamp: fileMessage.timestamp,
      messageType: "file",
    });
  };

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setUnreadCount(0);
  };

  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const mySender = isHospital ? 'hospital' : 'vendor';

  return (
    <>
      <button
        className={`global-chat-floating-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={toggleChat}
        title="문의하기"
      >
        <span className="chat-btn-text">문의</span>
        {unreadCount > 0 && (
          <span className="chat-unread-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="global-chat-overlay" onClick={toggleChat}>
          <div className="global-chat-container" onClick={e => e.stopPropagation()}>
            <div className="global-chat-header">
              <div className="global-chat-header-info">
                <h3>{currentContext?.title || '문의하기'}</h3>
                {currentContext?.type === 'invoice' && (
                  <span className="chat-context-badge">명세서: {currentContext.invoiceId}</span>
                )}
                <span className="chat-receiver-name">
                  {selectedContact ? `${selectedContact.name} · ${selectedContact.subtitle}` : (isHospital ? '도매업체' : '병원')}
                </span>
              </div>
              <button className="global-chat-close-btn" onClick={toggleChat}>×</button>
            </div>

            <div className="global-chat-body">
              {/* 연락처 목록 */}
              <div className="global-chat-threadlist">
                <div className="chat-sidebar-title">대화 목록</div>
                <div className="chat-thread-list">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      className={`chat-thread-item ${contact.id === selectedContactId ? "active" : ""}`}
                      onClick={() => setSelectedContactId(contact.id)}
                    >
                      <div className="chat-thread-name">{contact.name}</div>
                      <div className="chat-thread-preview">{contact.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 메시지 패널 */}
              <div className="global-chat-panel">
                <div className="global-chat-messages">
                  {isLoadingHistory && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                      대화 내역 불러오는 중...
                    </div>
                  )}
                  {!isLoadingHistory && messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '13px' }}>
                      대화를 시작해 보세요
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`global-chat-message ${msg.sender === mySender ? 'sent' : 'received'}`}
                    >
                      <div className="global-message-header">
                        <span className="global-message-sender">{msg.senderName}</span>
                        <span className="global-message-time">
                          {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="global-message-content">
                        {msg.messageType === 'file' ? (
                          <div className="global-file-message">
                            <span className="file-icon">첨부</span> {msg.message}
                            <button className="btn-outline btn-small" style={{ marginLeft: '8px' }}>
                              다운로드
                            </button>
                          </div>
                        ) : (
                          <p>{msg.message}</p>
                        )}
                      </div>
                      {readStatus?.lastReadId === msg.id && msg.sender === mySender && (
                        <div className="global-message-read">읽음</div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="global-chat-message received">
                      <div className="global-typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <form className="global-chat-input-form" onSubmit={handleSend}>
                  <div className="global-chat-input-actions">
                    <label className="global-file-upload-btn">
                      <span className="file-icon">첨부</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    className="global-chat-input"
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="메시지를 입력하세요..."
                  />
                  <button type="submit" className="global-chat-send-btn" disabled={!newMessage.trim()}>
                    전송
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalChat;

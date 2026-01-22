import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import '../css/GlobalChat.css';
import chatService from "../services/chatService";
import authStorage from "../services/authStorage";

const GlobalChat = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentContext, setCurrentContext] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState('');
  const messagesEndRef = useRef(null);

  const user = authStorage.getUser();
  const isHospital = user.role === 'hospital';
  const isVendor = user.role === 'vendor';

  const getSelfId = () => {
    if (isHospital) return `hospital_${user.hospitalId || "hospital-snu"}`;
    if (isVendor) return `vendor_${user.companyCode || "dh-pharm"}`;
    return "guest";
  };

  const getContactSelfId = (contactId) => {
    if (!contactId) return "unknown";
    if (isHospital) return `vendor_${contactId}`;
    return `hospital_${contactId}`;
  };

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

  const chatThreads = useMemo(() => {
    if (!currentContext) return [];
    return contacts.map((contact, idx) => {
      const key = chatService.getChatKey({
        invoiceId: currentContext?.type === 'invoice' ? currentContext.invoiceId : null,
        selfId: getSelfId(),
        otherId: getContactSelfId(contact.id)
      });
      const history = chatService.getMessages(key);
      const last = history[history.length - 1];
      return {
        id: contact.id,
        name: contact.name,
        subtitle: contact.subtitle,
        lastMessage: last?.message || "대화를 시작해 보세요",
        lastTime: last?.timestamp || null,
        order: last?.timestamp ? new Date(last.timestamp).getTime() : -(idx + 1),
      };
    }).sort((a, b) => b.order - a.order);
  }, [contacts, currentContext]);

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
        setCurrentContext({
          type: 'invoice',
          invoiceId: invoiceId,
          title: `명세서 ${invoiceId}`
        });
      }
    } else {
      setCurrentContext({
        type: 'general',
        title: isHospital ? '도매업체 문의' : '병원 문의'
      });
    }
  }, [location, isHospital]);

  const chatKey = useMemo(() => {
    if (!selectedContactId) return '';
    return chatService.getChatKey({
      invoiceId: currentContext?.type === 'invoice' ? currentContext.invoiceId : null,
      selfId: getSelfId(),
      otherId: getContactSelfId(selectedContactId)
    });
  }, [selectedContactId, currentContext]);

  useEffect(() => {
    if (isOpen && chatKey) {
      const loaded = chatService.getMessages(chatKey);
      setMessages(loaded);
      setUnreadCount(0);
    }
  }, [isOpen, chatKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!chatKey) return;
    const onStorage = (event) => {
      if (event.key === chatKey) {
        const next = chatService.getMessages(chatKey);
        setMessages(next);
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      }
      if (event.key === `chat_typing_${chatKey}`) {
        setIsTyping(event.newValue === "1");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [chatKey, isOpen]);

  useEffect(() => {
    if (!chatKey) return;
    const interval = setInterval(() => {
      const typing = localStorage.getItem(`chat_typing_${chatKey}`) === "1";
      setIsTyping(typing);
    }, 1000);
    return () => clearInterval(interval);
  }, [chatKey]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatKey) return;

    const message = {
      id: Date.now(),
      sender: isHospital ? 'hospital' : 'vendor',
      senderName: isHospital ? (user.name || '병원 담당자') : (user.companyName || '도매업체'),
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
      context: currentContext
    };

    chatService.saveMessage(chatKey, message);
    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (chatKey) {
      localStorage.setItem(`chat_typing_${chatKey}`, "1");
      setTimeout(() => {
        localStorage.setItem(`chat_typing_${chatKey}`, "0");
      }, 1200);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !chatKey) return;

    const fileMessage = {
      id: Date.now(),
      sender: isHospital ? 'hospital' : 'vendor',
      senderName: isHospital ? (user.name || '병원 담당자') : (user.companyName || '도매업체'),
      message: file.name,
      timestamp: new Date().toISOString(),
      type: 'file',
      context: currentContext
    };

    chatService.saveMessage(chatKey, fileMessage);
    setMessages((prev) => [...prev, fileMessage]);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

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
              <div className="global-chat-threadlist">
                <div className="chat-sidebar-title">대화 목록</div>
                <div className="chat-thread-list">
                  {chatThreads.map((thread) => (
                    <button
                      key={thread.id}
                      className={`chat-thread-item ${thread.id === selectedContactId ? "active" : ""}`}
                      onClick={() => setSelectedContactId(thread.id)}
                    >
                      <div className="chat-thread-name">{thread.name}</div>
                      <div className="chat-thread-preview">{thread.lastMessage}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="global-chat-panel">
                <div className="global-chat-messages">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`global-chat-message ${msg.sender === (isHospital ? 'hospital' : 'vendor') ? 'sent' : 'received'}`}
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
                        {msg.type === 'file' ? (
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
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="global-chat-message received">
                      <div className="global-typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
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

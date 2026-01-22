import React, { useState, useEffect, useRef } from 'react';
import '../css/InvoiceChat.css';

const InvoiceChat = ({ invoiceId, vendorName, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // 채팅 내역 로드 (실제로는 API 호출)
    loadMessages();
  }, [invoiceId]);

  useEffect(() => {
    // 스크롤을 맨 아래로
    scrollToBottom();
  }, [messages]);

  const loadMessages = () => {
    // 임시 메시지 데이터
    const mockMessages = [
      {
        id: 1,
        sender: 'hospital',
        senderName: '병원 담당자',
        message: `${invoiceId} 명세서에 대해 문의드립니다.`,
        timestamp: new Date(Date.now() - 3600000),
        type: 'text'
      },
      {
        id: 2,
        sender: 'vendor',
        senderName: vendorName || '도매업체',
        message: '네, 어떤 부분이 궁금하신가요?',
        timestamp: new Date(Date.now() - 3300000),
        type: 'text'
      }
    ];

    setMessages(mockMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: 'hospital',
      senderName: '병원 담당자',
      message: newMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // 상대방 타이핑 시뮬레이션
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      // 실제로는 WebSocket 또는 폴링으로 받아옴
      const response = {
        id: Date.now() + 1,
        sender: 'vendor',
        senderName: vendorName || '도매업체',
        message: '문의 내용 확인했습니다. 검토 후 답변드리겠습니다.',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 업로드 처리 (실제로는 서버에 업로드)
    const fileMessage = {
      id: Date.now(),
      sender: 'hospital',
      senderName: '병원 담당자',
      message: file.name,
      timestamp: new Date(),
      type: 'file',
      file: file
    };

    setMessages([...messages, fileMessage]);
  };

  if (!isOpen) return null;

  return (
    <div className="invoice-chat-overlay" onClick={onClose}>
      <div className="invoice-chat-container" onClick={e => e.stopPropagation()}>
        <div className="chat-header">
          <div className="chat-header-info">
            <h3>명세서 문의</h3>
            <span className="chat-invoice-id">{invoiceId}</span>
            <span className="chat-vendor-name">{vendorName}</span>
          </div>
          <button className="chat-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="chat-messages" ref={chatContainerRef}>
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`chat-message ${msg.sender === 'hospital' ? 'sent' : 'received'}`}
            >
              <div className="message-header">
                <span className="message-sender">{msg.senderName}</span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="message-content">
                {msg.type === 'file' ? (
                  <div className="file-message">
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
            <div className="chat-message received">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSend}>
          <div className="chat-input-actions">
            <label className="file-upload-btn">
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
            className="chat-input"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
          />
          <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
            전송
          </button>
        </form>
      </div>
    </div>
  );
};

export default InvoiceChat;

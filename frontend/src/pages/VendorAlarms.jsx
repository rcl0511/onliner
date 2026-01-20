import React, { useState, useEffect } from "react";
import '../css/common.css';

export default function VendorAlarms() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    // Mock data for clean design
    setNotices([
      { id: 1, title: '2024년 하반기 신규 약품 리스트 업데이트 안내', date: '2024-06-20', author: '운영팀', category: '공지' },
      { id: 2, title: '물류센터 시스템 정기 점검 안내 (06/25)', date: '2024-06-19', author: 'IT지원팀', category: '점검' },
      { id: 3, title: '추석 연휴 배송 일정 사전 안내', date: '2024-06-15', author: '물류팀', category: '배송' },
    ]);
  }, []);

  return (
    <div style={{ background: 'white', padding: '32px', minHeight: 'calc(100vh - 48px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800, color: '#1E293B' }}>공지사항</h2>
          <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>협력업체 및 내부 팀을 위한 주요 공지사항을 확인하세요.</p>
        </div>
        <button className="btn-primary">새 공지 작성</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {notices.map((n) => (
          <div key={n.id} style={{ 
            background: 'white', 
            padding: '24px', 
            borderRadius: '16px', 
            border: '1px solid #F1F5F9', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
          >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: '6px', 
                fontSize: '12px', 
                fontWeight: 700, 
                background: '#EEF2FF', 
                color: '#475BE8' 
              }}>{n.category}</span>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>{n.title}</div>
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>{n.author} • {n.date}</div>
              </div>
            </div>
            <span style={{ color: '#CBD5E1' }}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

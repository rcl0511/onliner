import React, { useState, useEffect } from "react";
import '../css/common.css';

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Mock data
    setPosts([
      { id: 1, title: '2024년 하반기 시스템 업데이트 안내', author: '시스템 관리자', date: '2024-06-20', views: 245, category: '공지' },
      { id: 2, title: '신규 약품 등록 프로세스 변경 안내', author: '운영팀', date: '2024-06-18', views: 189, category: '안내' },
      { id: 3, title: '배송 정책 개선 사항 안내', author: '물류팀', date: '2024-06-15', views: 156, category: '정책' },
      { id: 4, title: '명세서 발행 기능 개선 완료', author: '개발팀', date: '2024-06-10', views: 312, category: '업데이트' },
      { id: 5, title: '연말 정산 관련 안내사항', author: '회계팀', date: '2024-06-05', views: 278, category: '안내' },
    ]);
  }, []);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '32px', background: 'white', minHeight: 'calc(100vh - 48px)' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>커뮤니티</h2>
        <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>시스템 공지사항 및 커뮤니티 게시글을 확인하세요.</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="제목 또는 작성자로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ width: '100%', maxWidth: '400px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="card"
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(4px)';
              e.currentTarget.style.boxShadow = '0 8px 12px -2px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: '#EEF2FF',
                    color: '#475BE8'
                  }}>
                    {post.category}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
                    {post.title}
                  </h3>
                </div>
                <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>
                  작성자: {post.author} • {post.date} • 조회수: {post.views}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import vectorLogo from '../assets/Vector.svg';
import toggleIcon from '../assets/sidebar-left.svg';
import '../css/MainLayout.css';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = JSON.parse(localStorage.getItem('userInfo')) || {};
  const role = user.role;
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItem = (text, path) => (
    <div
      key={text}
      className="mainlayout-nav-item"
      onClick={() => navigate(path)}
    >
      {text}
    </div>
  );

  const hospitalMenu = [
    navItem('메인화면', '/hospital/dashboard'),
    navItem('주문서 작성하기', '/hospital/order'),
    navItem('명세서 확인하기', '/hospital/invoice'),
    navItem('결제금액관리', '/hospital/payment'),
    navItem('기타', '/hospital/logs'),
  ];

  const vendorMenu = [
    navItem('메인화면', '/vendor/dashboard'),
    navItem('주문관리', '/vendor/orders'),
    navItem('재고관리', '/vendor/stocks'),
    navItem('배송관리', '/vendor/delivery'),
    navItem('명세서 발행', '/vendor/invoice'),
    navItem('거래장 조회', '/vendor/trade'),
    navItem('거래처 관리', '/vendor/clients'),
    navItem('공지사항', '/vendor/alarms')
  ];

  const footerLinks = [
    { text: '공지사항', path: '/community' },
    { text: '권한설정', path: '/settings/permissions' },
    { text: '설정관리', path: '/settings/general' }
  ];

  return (
    <div className="mainlayout-root">
      {sidebarOpen && (
        <aside className="mainlayout-sidebar">
          {/* 로고 및 토글 */}
          <div className="mainlayout-header">
            <div className="mainlayout-logo-row">
              <img src={vectorLogo} alt="로고" className="mainlayout-logo-img" />
              <span className="mainlayout-logo-title">
                온라인 명세서
              </span>
            </div>
            <img src={toggleIcon} alt="Toggle" className="mainlayout-toggle" onClick={toggleSidebar} />
          </div>
          {/* 네비게이션 메뉴 */}
          <nav className="mainlayout-nav">
            {role === 'hospital' ? hospitalMenu : vendorMenu}
          </nav>
          {/* 하단 링크 */}
          <div className="mainlayout-footer">
            <div className="mainlayout-footer-title">
              Links
            </div>
            {footerLinks.map(({ text, path }) => (
              <div
                key={text}
                className="mainlayout-footer-link"
                onClick={() => navigate(path)}
              >
                {text}
              </div>
            ))}
          </div>
          {/* 사용자 정보 */}
          <div className="mainlayout-userinfo">
            <div className="mainlayout-user-avatar" />
            <div>
              <div className="mainlayout-user-name">
                {user.name || '사용자 이름'}
              </div>
              <div className="mainlayout-user-email">
                {user.email || 'user@example.com'}
              </div>
            </div>
          </div>
        </aside>
      )}
      {/* 메인 콘텐츠 */}
      <main className="mainlayout-main">
        {!sidebarOpen && (
          <div className="mainlayout-menu-btn" onClick={toggleSidebar}>
            <span>☰ 메뉴 열기</span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;

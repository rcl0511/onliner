import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import vectorLogo from "../assets/Vector.svg";
import toggleIcon from "../assets/sidebar-left.svg";
import GlobalChat from "../components/GlobalChat";
import authStorage from "../services/authStorage";
import "../css/MainLayout.css";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const user = authStorage.getUser();

  const role = user.role; // "hospital" | "vendor"

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const navItem = (text, path) => {
    const isActive = location.pathname === path;
    return (
      <div
        key={text}
        className={`mainlayout-nav-item ${isActive ? "active" : ""}`}
        onClick={() => navigate(path)}
        role="button"
        tabIndex={0}
      >
        {text}
      </div>
    );
  };

  const hospitalMenu = [
    navItem("수신함", "/hospital/inbox"),
    navItem("마이페이지", "/hospital/mypage"),
    navItem("메인화면", "/hospital/dashboard"),
    navItem("주문서 작성하기", "/hospital/order"),
    navItem("결제금액관리", "/hospital/payment"),
    navItem("기타", "/hospital/logs"),
  ];

  // 권한별 메뉴 필터링
  const getVendorMenu = () => {
    const permission = user.permission; // MASTER, SALES, WAREHOUSE
    const allMenus = [
      navItem("메인화면", "/vendor/dashboard"),
      navItem("주문관리", "/vendor/orders"),
      navItem("재고관리", "/vendor/stocks"),
      navItem("배송관리", "/vendor/delivery"),
      navItem("명세서 발행", "/vendor/invoice"),
      navItem("거래장 조회", "/vendor/trade"),
      navItem("명세서 조회", "/vendor/invoicesave"),
      navItem("거래처 관리", "/vendor/clients"),
      navItem("공지사항", "/vendor/alarms"),
    ];

    // 마스터 관리자: 모든 메뉴 접근 가능
    if (permission === 'MASTER') {
      return allMenus;
    }
    
    // 영업사원: 주문, 명세서, 거래처 관리
    if (permission === 'SALES') {
      return [
        navItem("메인화면", "/vendor/dashboard"),
        navItem("주문관리", "/vendor/orders"),
        navItem("명세서 발행", "/vendor/invoice"),
        navItem("명세서 조회", "/vendor/invoicesave"),
        navItem("거래처 관리", "/vendor/clients"),
      ];
    }
    
    // 창고 관리자: 재고, 배송 관리
    if (permission === 'WAREHOUSE') {
      return [
        navItem("메인화면", "/vendor/dashboard"),
        navItem("재고관리", "/vendor/stocks"),
        navItem("배송관리", "/vendor/delivery"),
      ];
    }

    // 기본값: 모든 메뉴 (권한 정보가 없을 경우)
    return allMenus;
  };

  const vendorMenu = getVendorMenu();

  const footerLinks = [
    { text: "공지사항", path: "/community" },
    { text: "권한설정", path: "/settings/permissions" },
    { text: "설정관리", path: "/settings/general" },
  ];

  const onLogout = () => {
    authStorage.clearUser();
    navigate(role === "vendor" ? "/vendor/login" : "/hospital/login");
  };

  return (
    <div className="mainlayout-root">
      {sidebarOpen && (
        <aside className="mainlayout-sidebar">
          {/* 로고 및 토글 */}
          <div className="mainlayout-header">
            <div className="mainlayout-logo-row" onClick={() => navigate(role === "vendor" ? "/vendor/dashboard" : "/hospital/dashboard")}>
              <img src={vectorLogo} alt="로고" className="mainlayout-logo-img" />
              <span className="mainlayout-logo-title">온라인 명세서</span>
            </div>

            <img
              src={toggleIcon}
              alt="Toggle"
              className="mainlayout-toggle"
              onClick={toggleSidebar}
            />
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="mainlayout-nav">
            {!role ? (
              <div className="mainlayout-nav-empty">
                로그인 정보가 없습니다.
              </div>
            ) : role === "hospital" ? (
              hospitalMenu
            ) : (
              vendorMenu
            )}
          </nav>

          {/* 하단 링크 */}
          <div className="mainlayout-footer">
            <div className="mainlayout-footer-title">Links</div>
            {footerLinks.map(({ text, path }) => (
              <div
                key={text}
                className={`mainlayout-footer-link ${location.pathname === path ? "active" : ""}`}
                onClick={() => navigate(path)}
                role="button"
                tabIndex={0}
              >
                {text}
              </div>
            ))}
          </div>

          {/* 사용자 정보 + 로그아웃 */}
          <div className="mainlayout-userinfo">
            <div className="mainlayout-user-avatar" />
            <div className="mainlayout-user-block">
              <div className="mainlayout-user-name">{user.name || "사용자 이름"}</div>
              <div className="mainlayout-user-email">{user.email || "user@example.com"}</div>
              {user.companyName && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {user.companyName} ({user.companyCode})
                </div>
              )}
              {user.permission && (
                <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                  {user.permission === 'MASTER' ? '마스터 관리자' : 
                   user.permission === 'SALES' ? '영업사원' : 
                   user.permission === 'WAREHOUSE' ? '창고 관리자' : ''}
                </div>
              )}
              <button className="mainlayout-logout" onClick={onLogout}>
                로그아웃
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 메인 콘텐츠 */}
      <main className={`mainlayout-main ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        {!sidebarOpen && (
          <div className="mainlayout-menu-btn" onClick={toggleSidebar} style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 1000 }}>
            <span>☰ 메뉴 열기</span>
          </div>
        )}
        <Outlet />
      </main>

      {/* 전역 채팅 컴포넌트 */}
      {role && <GlobalChat />}
    </div>
  );
};

export default MainLayout;

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HospitalLogin from "./pages/HospitalLogin";
import VendorLogin from "./pages/VendorLogin";

import VendorDashboard from "./pages/VendorDashboard";
import VendorOrdersManagement from "./pages/VendorOrdersManagement";
import VendorStocks from "./pages/VendorStocks";
import VendorInvoice from "./pages/VendorInvoice";
import VendorClientManagement from "./pages/VendorClientManagement";
import VendorLedger from "./pages/VendorLedger";
import VendorDelivery from "./pages/VendorDelivery";

import MainLayout from "./Layout/MainLayout";
import RequireAuth from "./components/RequireAuth";
import authStorage from "./services/authStorage";

// ✅ 빈 페이지들 (아래 2번에서 생성)
import HospitalDashboard from "./pages/HospitalDashboard";
import HospitalOrder from "./pages/HospitalOrder";
import HospitalInvoice from "./pages/HospitalInvoice";
import HospitalPayment from "./pages/HospitalPayment";
import HospitalLogs from "./pages/HospitalLogs";
import HospitalInbox from "./pages/HospitalInbox";
import HospitalMyPage from "./pages/HospitalMyPage";

import VendorInvoiceSave from "./pages/VendorInvoiceSave";
import VendorAlarms from "./pages/VendorAlarms";
import Community from "./pages/Community";
import Permissions from "./pages/Permissions";
import SettingsGeneral from "./pages/SettingsGeneral";

// 루트 경로에서 로그인 상태 확인 후 리다이렉트
function RootRedirect() {
  const user = authStorage.getUser();

  // 로그인되어 있으면 해당 역할의 대시보드로
  if (user && user.role) {
    if (user.role === "vendor") {
      return <Navigate to="/vendor/dashboard" replace />;
    } else if (user.role === "hospital") {
      return <Navigate to="/hospital/inbox" replace />;
    }
  }

  // 로그인되지 않았으면 자동으로 테스트 계정으로 로그인 처리
  const autoLoginUser = {
    email: 'master@dh-pharm.com',
    role: 'vendor',
    companyCode: 'dh-pharm',
    permission: 'MASTER',
    name: '대표 관리자',
    companyName: 'DH약품'
  };
  authStorage.setUser(autoLoginUser);
  return <Navigate to="/vendor/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 첫 진입 - 로그인 상태 확인 후 리다이렉트 */}
        <Route path="/" element={<RootRedirect />} />

        {/* 로그인(레이아웃 없음) */}
        <Route path="/hospital/login" element={<HospitalLogin />} />
        <Route path="/vendor/login" element={<VendorLogin />} />

        {/* ===== 병원 영역 ===== */}
        <Route element={<RequireAuth role="hospital" />}>
          <Route element={<MainLayout />}>
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/hospital/inbox" element={<HospitalInbox />} />
            <Route path="/hospital/invoice/:invoiceId" element={<HospitalInvoice />} />
            <Route path="/hospital/mypage" element={<HospitalMyPage />} />
            <Route path="/hospital/order" element={<HospitalOrder />} />
            <Route path="/hospital/payment" element={<HospitalPayment />} />
            <Route path="/hospital/logs" element={<HospitalLogs />} />
          </Route>
        </Route>

        {/* ===== 벤더 영역 ===== */}
        <Route element={<RequireAuth role="vendor" />}>
          <Route element={<MainLayout />}>
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/orders" element={<VendorOrdersManagement />} />
            <Route path="/vendor/stocks" element={<VendorStocks />} />
            <Route path="/vendor/delivery" element={<VendorDelivery />} />
            <Route path="/vendor/invoice" element={<VendorInvoice />} />
            <Route path="/vendor/trade" element={<VendorLedger />} />
            <Route path="/vendor/clients" element={<VendorClientManagement />} />

            {/* 메뉴에 있었던 추가 항목들 (일단 빈 페이지라도 라우팅 연결) */}
            <Route path="/vendor/invoicesave" element={<VendorInvoiceSave />} />
            <Route path="/vendor/alarms" element={<VendorAlarms />} />
            <Route path="/community" element={<Community />} />
            <Route path="/settings/permissions" element={<Permissions />} />
            <Route path="/settings/general" element={<SettingsGeneral />} />
          </Route>
        </Route>

        {/* 나머지는 로그인으로 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

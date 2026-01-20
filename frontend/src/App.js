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

// ✅ 빈 페이지들 (아래 2번에서 생성)
import HospitalDashboard from "./pages/HospitalDashboard";
import HospitalOrder from "./pages/HospitalOrder";
import HospitalInvoice from "./pages/HospitalInvoice";
import HospitalPayment from "./pages/HospitalPayment";
import HospitalLogs from "./pages/HospitalLogs";

import VendorInvoiceSave from "./pages/VendorInvoiceSave";
import VendorAlarms from "./pages/VendorAlarms";
import Community from "./pages/Community";
import Permissions from "./pages/Permissions";
import SettingsGeneral from "./pages/SettingsGeneral";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 첫 진입 */}
        <Route path="/" element={<Navigate to="/hospital/login" replace />} />

        {/* 로그인(레이아웃 없음) */}
        <Route path="/hospital/login" element={<HospitalLogin />} />
        <Route path="/vendor/login" element={<VendorLogin />} />

        {/* ===== 병원 영역 ===== */}
        <Route element={<RequireAuth role="hospital" />}>
          <Route element={<MainLayout />}>
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/hospital/order" element={<HospitalOrder />} />
            <Route path="/hospital/invoice" element={<HospitalInvoice />} />
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

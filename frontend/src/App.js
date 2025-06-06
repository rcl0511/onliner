// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import HospitalLogin            from './pages/HospitalLogin';
import VendorLogin              from './pages/VendorLogin';
import VendorDashboard          from './pages/VendorDashboard';
import VendorOrdersManagement   from './pages/VendorOrdersManagement';
import VendorStocks             from './pages/VendorStocks';
import VendorInvoice            from './pages/VendorInvoice';
import VendorClientManagement   from './pages/VendorClientManagement';
import VendorLedger             from './pages/VendorLedger';
import VendorDelivery           from './pages/VendorDelivery';     // 배송관리 페이지
import MainLayout               from './Layout/MainLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 페이지(레이아웃 없음) */}
        <Route path="/" element={<Navigate to="/hospital/login" replace />} />
        <Route path="/hospital/login" element={<HospitalLogin />} />
        <Route path="/vendor/login"   element={<VendorLogin />} />
        
        {/* 공통 레이아웃을 가지는 페이지들 */}
        <Route element={<MainLayout />}>
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/orders"    element={<VendorOrdersManagement />} />
          <Route path="/vendor/stocks"    element={<VendorStocks />} />
          <Route path="/vendor/invoice"   element={<VendorInvoice />} />
          <Route path="/vendor/clients"   element={<VendorClientManagement />} />
          <Route path="/vendor/trade"     element={<VendorLedger />} />
          <Route path="/vendor/delivery"  element={<VendorDelivery />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

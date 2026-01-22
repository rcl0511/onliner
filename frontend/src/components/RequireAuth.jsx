// src/components/RequireAuth.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import authStorage from "../services/authStorage";

export default function RequireAuth({ role }) {
  const location = useLocation();

  const user = authStorage.getUser();

  // 로그인 정보가 없으면 해당 역할 로그인으로
  if (!user || !user.role) {
    const to = role === "vendor" ? "/vendor/login" : "/hospital/login";
    return <Navigate to={to} replace state={{ from: location }} />;
  }

  // 역할이 다르면 접근 막기 (원하는 정책대로 조정 가능)
  if (role && user.role !== role) {
    const to = user.role === "vendor" ? "/vendor/dashboard" : "/hospital/dashboard";
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}

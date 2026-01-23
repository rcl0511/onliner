import axios from "axios";
import API_BASE from "./baseUrl";
import authStorage from "../services/authStorage";

export const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 에러 메시지 통일
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      "요청 중 오류가 발생했습니다.";
    return Promise.reject(new Error(typeof msg === "string" ? msg : "요청 오류"));
  }
);

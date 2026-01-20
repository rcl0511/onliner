import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

export const http = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
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

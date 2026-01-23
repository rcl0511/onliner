// src/pages/VendorLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/VendorLogin.css';
import authStorage from "../services/authStorage";
import API_BASE from "../api/baseUrl";
const VendorLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const finalCompanyCode = 'dh-pharm';

    fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'vendor',
        companyCode: finalCompanyCode,
        email,
        password,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || '로그인 실패');
        }
        return res.json();
      })
      .then((data) => {
        authStorage.setUser(data.user);
        authStorage.setToken(data.token);
        navigate('/vendor/dashboard');
      })
      .catch((err) => {
        setError(err.message || '아이디 또는 비밀번호가 잘못되었습니다.');
      });
  };

  return (
    <div className="vendor-login-bg">
      <form className="vendor-login-form" onSubmit={handleLogin}>
        <h2 className="vendor-login-title">도매업체 관리자 로그인</h2>

        <label className="vendor-login-label">아이디</label>
        <input
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="vendor-login-input"
          placeholder="아이디 입력"
        />

        <label className="vendor-login-label">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="vendor-login-input"
        />

        {error && <div className="vendor-login-error">{error}</div>}

        <button type="submit" className="vendor-login-btn main">
          로그인
        </button>
        <button 
          type="button" 
          className="vendor-login-btn sub" 
          onClick={() => navigate('/hospital/login')}
        >
          병원 로그인으로
        </button>

      </form>
    </div>
  );
};

export default VendorLogin;

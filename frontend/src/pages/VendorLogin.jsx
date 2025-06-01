// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('hospital');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    // ✅ 테스트용 마스터 계정
    if (email === "dev@master.com" && password === "1234") {
      const userInfo = { email, role };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      if (role === 'hospital') navigate('/hospital/dashboard');
      else navigate('/vendor/dashboard');
    } else {
      setError('아이디 또는 비밀번호가 잘못되었습니다.');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#F9FAFB', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <form onSubmit={handleLogin} style={{ width: 400, padding: 32, background: 'white', borderRadius: 8, boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#475BE8', fontSize: 24, fontWeight: '800', marginBottom: 24 }}>온라인 거래장</h2>

        <label style={{ display: 'block', marginBottom: 8, color: '#111827' }}>이메일</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '95%', padding: 12, marginBottom: 16, border: '1px solid #D1D5DB', borderRadius: 4 }}
        />

        <label style={{ display: 'block', marginBottom: 8, color: '#111827' }}>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '95%', padding: 12, marginBottom: 16, border: '1px solid #D1D5DB', borderRadius: 4 }}
        />

        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 16 }}>
            <input type="radio" value="hospital" checked={role === 'hospital'} onChange={e => setRole(e.target.value)} /> 병원
          </label>
          <label>
            <input type="radio" value="vendor" checked={role === 'vendor'} onChange={e => setRole(e.target.value)} /> 도매업체
          </label>
        </div>

        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

        <button type="submit" style={{ width: '100%', padding: 12, background: '#475BE8', color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold', marginBottom: 12 }}>
          로그인
        </button>
        <button onClick={() => navigate('/signup')} style={{ width: '100%', padding: 12, background: '#E5E7EB', color: '#111827', border: 'none', borderRadius: 4, fontWeight: 'bold' }}>
          회원가입
        </button>
      </form>
    </div>
  );
};

export default Login;

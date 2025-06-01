import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/HospitalLogin.css';

const HospitalLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === "dev@master.com" && password === "1234") {
      const userInfo = { email, role: 'hospital' };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      navigate('/hospital/dashboard');
    } else {
      setError('아이디 또는 비밀번호가 잘못되었습니다.');
    }
  };

  return (
    <div className="hospital-login-bg">
      <form className="hospital-login-form" onSubmit={handleLogin}>
        <h2 className="hospital-login-title">병원 로그인</h2>

        <label className="hospital-login-label">이메일</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="hospital-login-input"
        />

        <label className="hospital-login-label">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="hospital-login-input"
        />

        {error && <div className="hospital-login-error">{error}</div>}

        <button type="submit" className="hospital-login-btn main">로그인</button>
        <button type="button" className="hospital-login-btn sub" onClick={() => navigate('/hospital/signup')}>회원가입</button>
        <button type="button" className="hospital-login-btn link" onClick={() => navigate('/vendor/login')}>도매업체 로그인으로</button>
      </form>
    </div>
  );
};

export default HospitalLogin;

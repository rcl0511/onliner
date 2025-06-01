import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/VendorLogin.css';

const VendorLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === "dev@master.com" && password === "1234") {
      const userInfo = { email, role: 'vendor' };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      navigate('/vendor/dashboard');
    } else {
      setError('아이디 또는 비밀번호가 잘못되었습니다.');
    }
  };

  return (
    <div className="vendor-login-bg">
      <form className="vendor-login-form" onSubmit={handleLogin}>
        <h2 className="vendor-login-title">도매업체 로그인</h2>

        <label className="vendor-login-label">이메일</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="vendor-login-input"
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

        <button type="submit" className="vendor-login-btn main">로그인</button>
        <button type="button" className="vendor-login-btn sub" onClick={() => navigate('/vendor/signup')}>회원가입</button>
        <button type="button" className="vendor-login-btn link" onClick={() => navigate('/hospital/login')}>병원 로그인으로</button>
      </form>
    </div>
  );
};

export default VendorLogin;

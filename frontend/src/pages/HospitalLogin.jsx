import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../css/HospitalLogin.css';
import authStorage from "../services/authStorage";

const HospitalLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 1회성 링크 처리 (토큰 기반)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // 토큰 검증 및 명세서 상세 페이지로 이동
      // 실제로는 서버에서 토큰을 검증하고 명세서 ID를 받아와야 함
      const invoiceId = searchParams.get('invoiceId');
      if (invoiceId) {
        // 로그인 없이 명세서 상세 페이지로 이동 (24시간 유효)
        navigate(`/hospital/invoice/${invoiceId}?token=${token}`);
      }
    }

    // 최초 로그인 여부 확인 (비밀번호 변경 필요 여부)
    const userInfo = authStorage.getUser();
    if (userInfo.role === 'hospital' && userInfo.requiresPasswordChange) {
      setShowPasswordChange(true);
    }
  }, [searchParams, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    
    // 임시 계정 로그인 (전화번호 기반)
    // 실제로는 서버 API 호출
    const tempAccounts = {
      '01012345678': { password: 'temp1234', requiresPasswordChange: true },
      '01087654321': { password: 'temp1234', requiresPasswordChange: false },
    };

    if (tempAccounts[phone] && tempAccounts[phone].password === password) {
      const userInfo = {
        phone,
        role: 'hospital',
        requiresPasswordChange: tempAccounts[phone].requiresPasswordChange,
        name: '병원 담당자',
        hospitalName: '서울대학교병원'
      };
      authStorage.setUser(userInfo);
      
      // 최초 로그인 시 비밀번호 변경 강제
      if (tempAccounts[phone].requiresPasswordChange) {
        setShowPasswordChange(true);
      } else {
        navigate('/hospital/inbox');
      }
    } else {
      setError('전화번호 또는 비밀번호가 잘못되었습니다.');
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    // 비밀번호 변경 처리
    const userInfo = authStorage.getUser();
    userInfo.requiresPasswordChange = false;
    authStorage.setUser(userInfo);
    localStorage.setItem('hospitalPassword', newPassword); // 실제로는 서버에 저장
    
    setShowPasswordChange(false);
    navigate('/hospital/inbox');
  };

  return (
    <div className="hospital-login-bg">
      {showPasswordChange ? (
        <form className="hospital-login-form" onSubmit={handlePasswordChange}>
          <h2 className="hospital-login-title">비밀번호 변경</h2>
          <p style={{ color: '#64748B', marginBottom: '24px', textAlign: 'center', fontSize: '14px' }}>
            보안을 위해 비밀번호를 변경해주세요.
          </p>

          <label className="hospital-login-label">새 비밀번호</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            className="hospital-login-input"
            placeholder="6자 이상 입력"
          />

          <label className="hospital-login-label">비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="hospital-login-input"
            placeholder="비밀번호 재입력"
          />

          {error && <div className="hospital-login-error">{error}</div>}

          <button type="submit" className="hospital-login-btn main">변경하기</button>
        </form>
      ) : (
        <form className="hospital-login-form" onSubmit={handleLogin}>
          <h2 className="hospital-login-title">병원 로그인</h2>
          <p style={{ color: '#64748B', marginBottom: '24px', textAlign: 'center', fontSize: '14px' }}>
            도매업체에서 발급한 임시 계정으로 로그인하세요
          </p>

          <label className="hospital-login-label">전화번호</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            className="hospital-login-input"
            placeholder="010-1234-5678"
          />

          <label className="hospital-login-label">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="hospital-login-input"
            placeholder="초기 비밀번호"
          />

          {error && <div className="hospital-login-error">{error}</div>}

          <button type="submit" className="hospital-login-btn main">로그인</button>
          <button type="button" className="hospital-login-btn link" onClick={() => navigate('/vendor/login')}>
            도매업체 로그인으로
          </button>
        </form>
      )}
    </div>
  );
};

export default HospitalLogin;

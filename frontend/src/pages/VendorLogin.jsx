// src/pages/VendorLogin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/VendorLogin.css';
import authStorage from "../services/authStorage";
const VendorLogin = () => {
  const navigate = useNavigate();
  const [companyCode, setCompanyCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState('subdomain'); // 'subdomain' or 'code'

  // 서브도메인에서 업체 코드 추출 (예: dh-pharm.myservice.com -> dh-pharm)
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname.includes('.') && hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
      const subdomain = hostname.split('.')[0];
      if (subdomain && subdomain !== 'www') {
        setCompanyCode(subdomain);
        setLoginMode('subdomain');
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // 업체 코드 검증
    const finalCompanyCode = companyCode.trim().toLowerCase();
    if (!finalCompanyCode) {
      setError('업체 코드를 입력해주세요.');
      return;
    }

    // ✅ 테스트용 계정 (실제로는 API 호출)
    // 마스터 관리자: master@dh-pharm.com / 1234
    // 영업사원: sales@dh-pharm.com / 1234
    // 창고 관리자: warehouse@dh-pharm.com / 1234
    const testAccounts = {
      'dh-pharm': {
        'master@dh-pharm.com': { password: '1234', permission: 'MASTER', name: '대표 관리자' },
        'sales@dh-pharm.com': { password: '1234', permission: 'SALES', name: '영업 담당' },
        'warehouse@dh-pharm.com': { password: '1234', permission: 'WAREHOUSE', name: '창고 관리자' },
      },
      'test-company': {
        'master@test.com': { password: '1234', permission: 'MASTER', name: '대표 관리자' },
      }
    };

    const companyAccounts = testAccounts[finalCompanyCode];
    if (!companyAccounts) {
      setError('등록되지 않은 업체 코드입니다.');
      return;
    }

    const account = companyAccounts[email];
    if (!account || account.password !== password) {
      setError('아이디 또는 비밀번호가 잘못되었습니다.');
      return;
    }

    // 로그인 성공 - 사용자 정보 저장
    const userInfo = {
      email,
      role: 'vendor',
      companyCode: finalCompanyCode,
      permission: account.permission, // MASTER, SALES, WAREHOUSE
      name: account.name,
      companyName: finalCompanyCode === 'dh-pharm' ? 'DH약품' : '테스트업체'
    };
    authStorage.setUser(userInfo);
    navigate('/vendor/dashboard');
  };

  return (
    <div className="vendor-login-bg">
      <form className="vendor-login-form" onSubmit={handleLogin}>
        <h2 className="vendor-login-title">도매업체 관리자 로그인</h2>

        {/* 서브도메인 안내 */}
        {loginMode === 'subdomain' && companyCode && (
          <div style={{ 
            background: '#E3F2FD', 
            padding: '12px', 
            borderRadius: '4px', 
            marginBottom: '16px',
            fontSize: '14px',
            color: '#1976D2'
          }}>
            업체 코드: <strong>{companyCode}</strong> (서브도메인에서 자동 감지됨)
          </div>
        )}

        {/* 업체 코드 입력 (서브도메인 모드가 아닐 때) */}
        {loginMode === 'code' && (
          <>
            <label className="vendor-login-label">업체 코드</label>
            <input
              type="text"
              value={companyCode}
              onChange={e => setCompanyCode(e.target.value)}
              placeholder="예: dh-pharm"
              required
              className="vendor-login-input"
              style={{ textTransform: 'lowercase' }}
            />
          </>
        )}

        <label className="vendor-login-label">이메일</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="vendor-login-input"
          placeholder="예: master@dh-pharm.com"
        />

        <label className="vendor-login-label">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="vendor-login-input"
        />

        {/* 로그인 모드 전환 */}
        <div style={{ marginBottom: '16px', fontSize: '13px', color: '#666' }}>
          <button
            type="button"
            onClick={() => setLoginMode(loginMode === 'subdomain' ? 'code' : 'subdomain')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#475BE8', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {loginMode === 'subdomain' ? '업체 코드로 로그인' : '서브도메인 모드로 전환'}
          </button>
        </div>

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

        {/* 테스트 계정 안내 */}
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#F5F5F5', 
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>📌 업체코드:</strong> <code style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '3px' }}>dh-pharm</code> 또는 <code style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '3px' }}>test-company</code><br />
          <strong>테스트 계정:</strong><br />
          마스터: master@dh-pharm.com / 1234<br />
          영업: sales@dh-pharm.com / 1234<br />
          창고: warehouse@dh-pharm.com / 1234
        </div>
      </form>
    </div>
  );
};

export default VendorLogin;

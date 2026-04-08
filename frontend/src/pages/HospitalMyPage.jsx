import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import '../css/HospitalMyPage.css';
import API_BASE from "../api/baseUrl";
import authStorage from "../services/authStorage";
import authFetch from "../api/authFetch";
import { fetchHospitalInvoices } from "../services/invoiceRecordService";

const HospitalMyPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    const userInfo = authStorage.getUser();
    setUser(userInfo);
    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError('');
      try {
        const invoices = await fetchHospitalInvoices();
        setHistory(invoices);
      } catch (err) {
        setHistoryError(err.message || '거래 이력을 불러오지 못했습니다.');
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    authFetch(`${API_BASE}/api/auth/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error((await res.text()) || '비밀번호 변경에 실패했습니다.');
        }
        alert('비밀번호가 변경되었습니다.');
        setShowPasswordChange(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((err) => {
        setPasswordError(err.message || '비밀번호 변경에 실패했습니다.');
      });
  };

  const handleHistoryClick = (invoiceId) => {
    navigate(`/hospital/invoice/${invoiceId}`);
  };

  return (
    <div className="hospital-mypage">
      <h1>마이페이지</h1>

      <div className="mypage-sections">
        {/* 사용자 정보 */}
        <div className="mypage-section">
          <h2>사용자 정보</h2>
            <div className="user-info-card">
              <div className="user-info-item">
                <span className="info-label">병원명</span>
                <span className="info-value">{user?.hospitalName || '-'}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">전화번호</span>
                <span className="info-value">{user?.phone || '-'}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">이메일</span>
                <span className="info-value">{user?.email || '-'}</span>
              </div>
            </div>
        </div>

        {/* 비밀번호 변경 */}
        <div className="mypage-section">
          <h2>비밀번호 변경</h2>
          {!showPasswordChange ? (
            <button className="btn-primary" onClick={() => setShowPasswordChange(true)}>
              비밀번호 변경
            </button>
          ) : (
            <form className="password-change-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>현재 비밀번호</label>
                <input
                  type="password"
                  className="input-field"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>새 비밀번호</label>
                <input
                  type="password"
                  className="input-field"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="6자 이상 입력"
                />
              </div>

              <div className="form-group">
                <label>비밀번호 확인</label>
                <input
                  type="password"
                  className="input-field"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {passwordError && (
                <div className="error-message">{passwordError}</div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordError('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  변경하기
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 과거 거래 이력 */}
        <div className="mypage-section">
          <h2>과거 거래 이력</h2>
          <div className="history-list">
            {historyLoading ? (
              <div className="empty-state">
                <p>거래 이력을 불러오는 중입니다.</p>
              </div>
            ) : historyError ? (
              <div className="empty-state">
                <p>{historyError}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="empty-state">
                <p>거래 이력이 없습니다.</p>
              </div>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>명세서 번호</th>
                    <th>업체명</th>
                    <th>날짜</th>
                    <th>금액</th>
                    <th>상태</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.vendorName}</td>
                      <td>{format(new Date(item.date), 'yyyy-MM-dd')}</td>
                      <td>{Number(item.totalAmount || item.total || 0).toLocaleString()}원</td>
                      <td>
                        <span className={`status-badge status-${item.status}`}>
                          {item.status === 'confirmed' ? '확인완료' : item.status === 'disputed' ? '이의신청' : '미확인'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-outline btn-small"
                          onClick={() => handleHistoryClick(item.id)}
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalMyPage;

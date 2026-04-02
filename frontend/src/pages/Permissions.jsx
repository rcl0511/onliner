import React, { useState, useEffect } from "react";
import authStorage from '../services/authStorage';
import API_BASE from '../api/baseUrl';
import '../css/common.css';

const PERMISSION_LABELS = {
  MASTER: '마스터 관리자',
  SALES: '영업사원',
  WAREHOUSE: '창고 관리자',
};

const PERMISSION_STYLE = {
  MASTER: { background: '#EEF2FF', color: '#475BE8' },
  SALES: { background: '#EFF6FF', color: '#3B82F6' },
  WAREHOUSE: { background: '#F0FDF4', color: '#10B981' },
};

export default function Permissions() {
  const user = authStorage.getUser();
  const isMaster = user.permission === 'MASTER';
  const token = authStorage.getToken();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', permission: 'SALES', password: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isMaster) loadUsers();
  }, [isMaster]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError('사용자 목록을 불러오지 못했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadUsers();
      setShowAddModal(false);
      setNewUser({ email: '', name: '', permission: 'SALES', password: '' });
    } catch (err) {
      alert('사용자 추가 실패: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    const action = currentActive ? '비활성화' : '활성화';
    if (!window.confirm(`이 계정을 ${action}하시겠습니까?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: String(!currentActive) }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadUsers();
    } catch (err) {
      alert(`${action} 실패: ` + err.message);
    }
  };

  if (!isMaster) {
    return (
      <div style={{ padding: '32px', background: 'white', minHeight: 'calc(100vh - 48px)' }}>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h2 style={{ color: '#EF4444', marginBottom: '16px' }}>접근 권한이 없습니다</h2>
          <p style={{ color: '#64748B', fontSize: '16px' }}>권한 설정은 마스터 관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', background: 'white', minHeight: 'calc(100vh - 48px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>권한 설정</h2>
          <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>사용자 권한을 관리하고 새로운 사용자를 추가할 수 있습니다.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + 사용자 추가
        </button>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#EF4444', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#64748B' }}>로딩 중...</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>이메일</th>
                <th>이름</th>
                <th>권한</th>
                <th>상태</th>
                <th style={{ textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    등록된 사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} style={{ opacity: u.active ? 1 : 0.5 }}>
                    <td style={{ fontWeight: 600, color: '#1E293B' }}>{u.identifier}</td>
                    <td>{u.name}</td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        ...(PERMISSION_STYLE[u.permission] || { background: '#F1F5F9', color: '#64748B' })
                      }}>
                        {PERMISSION_LABELS[u.permission] || u.permission}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: u.active ? '#F0FDF4' : '#F1F5F9',
                        color: u.active ? '#10B981' : '#94A3B8',
                      }}>
                        {u.active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {u.permission !== 'MASTER' && (
                        <button
                          className="btn-outline"
                          onClick={() => handleToggleActive(u.id, u.active)}
                          style={{
                            fontSize: '12px',
                            padding: '5px 12px',
                            color: u.active ? '#EF4444' : '#10B981',
                            borderColor: u.active ? '#EF4444' : '#10B981',
                          }}
                        >
                          {u.active ? '비활성화' : '활성화'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>
              사용자 추가
            </h3>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#475BE8' }}>이메일</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-field"
                  placeholder="user@dh-pharm.com"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#475BE8' }}>이름</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="input-field"
                  placeholder="홍길동"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#475BE8' }}>권한</label>
                <select
                  value={newUser.permission}
                  onChange={(e) => setNewUser({ ...newUser, permission: e.target.value })}
                  className="select-field"
                >
                  <option value="SALES">영업사원</option>
                  <option value="WAREHOUSE">창고 관리자</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#475BE8' }}>
                  초기 비밀번호 <span style={{ color: '#94A3B8', fontWeight: 400 }}>(최초 로그인 시 변경 필요)</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-field"
                  placeholder="6자 이상"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? '추가 중...' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

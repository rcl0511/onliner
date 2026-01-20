import React, { useState, useEffect } from "react";
import '../css/common.css';

export default function Permissions() {
  const user = JSON.parse(localStorage.getItem('userInfo')) || {};
  const isMaster = user.permission === 'MASTER';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    permission: 'SALES',
    password: ''
  });

  useEffect(() => {
    if (isMaster) {
      loadUsers();
    }
  }, [isMaster]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const mockUsers = [
        { id: 1, email: 'master@dh-pharm.com', name: '대표 관리자', permission: 'MASTER', createdAt: '2024-01-15' },
        { id: 2, email: 'sales1@dh-pharm.com', name: '김영업', permission: 'SALES', createdAt: '2024-03-20' },
        { id: 3, email: 'warehouse@dh-pharm.com', name: '이창고', permission: 'WAREHOUSE', createdAt: '2024-02-10' },
        { id: 4, email: 'sales2@dh-pharm.com', name: '박영업', permission: 'SALES', createdAt: '2024-04-05' },
      ];
      setUsers(mockUsers);
    } catch (error) {
      alert('사용자 목록 조회 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const newId = users.length + 1;
      setUsers([...users, { ...newUser, id: newId, createdAt: new Date().toISOString().slice(0, 10) }]);
      alert('사용자가 추가되었습니다.');
      setShowAddModal(false);
      setNewUser({ email: '', name: '', permission: 'SALES', password: '' });
    } catch (error) {
      alert('사용자 추가 실패: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setUsers(users.filter(u => u.id !== userId));
    alert('사용자가 삭제되었습니다.');
  };

  const getPermissionText = (permission) => {
    switch (permission) {
      case 'MASTER': return '마스터 관리자';
      case 'SALES': return '영업사원';
      case 'WAREHOUSE': return '창고 관리자';
      default: return permission;
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
          사용자 추가
        </button>
      </div>

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
                <th>등록일</th>
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
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: '#1E293B' }}>{u.email}</td>
                    <td>{u.name}</td>
                    <td>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: u.permission === 'MASTER' ? '#EEF2FF' : u.permission === 'SALES' ? '#EFF6FF' : '#F0FDF4',
                        color: u.permission === 'MASTER' ? '#475BE8' : u.permission === 'SALES' ? '#3B82F6' : '#10B981'
                      }}>
                        {getPermissionText(u.permission)}
                      </span>
                    </td>
                    <td style={{ color: '#64748B' }}>{u.createdAt}</td>
                    <td style={{ textAlign: 'center' }}>
                      {u.permission !== 'MASTER' && (
                        <button
                          className="btn-outline"
                          onClick={() => handleDeleteUser(u.id)}
                          style={{ fontSize: '12px', padding: '6px 12px', color: '#EF4444', borderColor: '#EF4444' }}
                        >
                          삭제
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>사용자 추가</h3>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#475BE8' }}>
                  이메일
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#475BE8' }}>
                  이름
                </label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#475BE8' }}>
                  권한
                </label>
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
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#475BE8' }}>
                  비밀번호
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import authStorage from '../services/authStorage';
import API_BASE from '../api/baseUrl';
import '../css/HospitalLogs.css';

const LOG_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'order', label: '주문' },
  { value: 'invoice', label: '명세서' },
  { value: 'login', label: '로그인' },
];

export default function HospitalLogs() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = authStorage.getUser();
    const token = authStorage.getToken();

    fetch(`${API_BASE}/api/logs/hospital?hospitalId=${user.hospitalId || ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setLogs(data))
      .catch(() => {
        // API 미구현 시 샘플 데이터
        setLogs([
          { id: 1, type: 'login', description: '로그인', detail: 'IP: 192.168.1.1', createdAt: '2024-01-15T09:00:00' },
          { id: 2, type: 'order', description: '주문서 제출', detail: 'DH약품 / 타이레놀 외 5건', createdAt: '2024-01-15T10:30:00' },
          { id: 3, type: 'invoice', description: '명세서 확인', detail: 'INV-2024-001 / DH약품', createdAt: '2024-01-15T11:00:00' },
          { id: 4, type: 'invoice', description: '명세서 확인', detail: 'INV-2024-002 / 서울제약', createdAt: '2024-01-14T14:20:00' },
          { id: 5, type: 'login', description: '로그인', detail: 'IP: 192.168.1.1', createdAt: '2024-01-14T08:50:00' },
          { id: 6, type: 'order', description: '주문서 제출', detail: '서울제약 / 아스피린 외 3건', createdAt: '2024-01-13T15:00:00' },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = logs;
    if (typeFilter !== 'all') {
      result = result.filter((l) => l.type === typeFilter);
    }
    if (dateFilter) {
      result = result.filter((l) => l.createdAt.startsWith(dateFilter));
    }
    setFiltered(result);
  }, [logs, typeFilter, dateFilter]);

  const typeLabel = (type) => {
    switch (type) {
      case 'order': return { text: '주문', color: '#3B82F6' };
      case 'invoice': return { text: '명세서', color: '#10B981' };
      case 'login': return { text: '로그인', color: '#8B5CF6' };
      default: return { text: type, color: '#64748B' };
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="hospital-logs">
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#1E293B' }}>활동 로그</h2>

      <div className="logs-section">
        <div className="logs-filters">
          {LOG_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: typeFilter === t.value ? 'none' : '1px solid #E2E8F0',
                background: typeFilter === t.value ? '#475BE8' : '#fff',
                color: typeFilter === t.value ? '#fff' : '#64748B',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              marginLeft: 'auto',
              padding: '6px 10px',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 13,
              color: '#1E293B',
            }}
          />
        </div>

        {loading ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>로딩 중...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>로그가 없습니다.</p>
        ) : (
          <table className="logs-table">
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ textAlign: 'left', color: '#64748B', fontWeight: 600 }}>유형</th>
                <th style={{ textAlign: 'left', color: '#64748B', fontWeight: 600 }}>내용</th>
                <th style={{ textAlign: 'left', color: '#64748B', fontWeight: 600 }}>상세</th>
                <th style={{ textAlign: 'left', color: '#64748B', fontWeight: 600 }}>일시</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const badge = typeLabel(log.type);
                return (
                  <tr key={log.id}>
                    <td>
                      <span className="log-badge" style={{ background: badge.color + '1A', color: badge.color }}>
                        {badge.text}
                      </span>
                    </td>
                    <td style={{ color: '#1E293B' }}>{log.description}</td>
                    <td style={{ color: '#64748B', fontSize: 13 }}>{log.detail || '-'}</td>
                    <td style={{ color: '#94A3B8', fontSize: 13 }}>{formatDate(log.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

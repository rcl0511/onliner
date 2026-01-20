import React, { useState, useEffect, useMemo } from "react";
import '../css/common.css';

export default function VendorInvoiceSave() {
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    const mockInvoices = [
      { id: 1, invoiceNumber: 'INV-2406-001', customer: '테스트병원A', date: '2024-06-18', amount: 4500000, status: 'CONFIRMED' },
      { id: 2, invoiceNumber: 'INV-2406-002', customer: '테스트병원B', date: '2024-06-17', amount: 1200000, status: 'PENDING' },
      { id: 3, invoiceNumber: 'INV-2406-003', customer: '테스트병원C', date: '2024-06-15', amount: 8900000, status: 'CONFIRMED' },
      { id: 4, invoiceNumber: 'INV-2406-004', customer: '테스트병원D', date: '2024-06-14', amount: 3200000, status: 'CONFIRMED' },
      { id: 5, invoiceNumber: 'INV-2406-005', customer: '테스트병원E', date: '2024-06-13', amount: 2100000, status: 'PENDING' },
    ];
    setInvoices(mockInvoices);
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchesSearch = inv.invoiceNumber.includes(searchQuery) || inv.customer.includes(searchQuery);
      const invDate = new Date(inv.date);
      const start = new Date(dateFilter.startDate);
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59, 999);
      const matchesDate = invDate >= start && invDate <= end;
      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [invoices, statusFilter, searchQuery, dateFilter]);

  return (
    <div style={{ background: 'white', padding: '32px', minHeight: 'calc(100vh - 48px)' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>명세서 조회 및 관리</h2>
        <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>발행된 모든 거래명세서를 조회하고 상태를 관리합니다.</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>시작일</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>종료일</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-field"
            >
              <option value="ALL">전체 상태</option>
              <option value="CONFIRMED">확인완료</option>
              <option value="PENDING">대기중</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}>검색</label>
            <input
              type="text"
              placeholder="명세서 번호 또는 거래처..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>총 {filteredInvoices.length}건의 명세서</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              {['명세서 번호', '거래처', '발행일자', '공급가액', '상태', '관리'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                  조회된 명세서가 없습니다.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700, color: '#1E293B' }}>{inv.invoiceNumber}</td>
                  <td>{inv.customer}</td>
                  <td style={{ color: '#64748B' }}>{inv.date}</td>
                  <td style={{ fontWeight: 600, color: '#1E293B' }}>{inv.amount.toLocaleString()}원</td>
                  <td>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: inv.status === 'CONFIRMED' ? '#EEF2FF' : '#F8FAFC',
                      color: inv.status === 'CONFIRMED' ? '#475BE8' : '#94A3B8'
                    }}>
                      {inv.status === 'CONFIRMED' ? '확인완료' : '대기중'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>PDF 열기</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import notificationService from '../services/notificationService';
import { fetchHospitalInvoices } from '../services/invoiceRecordService';
import '../css/HospitalInbox.css';

const HospitalInbox = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [filterVendor, setFilterVendor] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchHospitalInvoices();
        setInvoices(data);
      } catch (err) {
        setError(err.message || '명세서 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    notificationService.init();
    loadInvoices();
  }, []);

  useEffect(() => {
    const refreshOnFocus = () => {
      fetchHospitalInvoices()
        .then((data) => setInvoices(data))
        .catch(() => {});
    };
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, []);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = [...invoices];

    // 발행 업체별 필터
    if (filterVendor !== 'all') {
      filtered = filtered.filter(inv => inv.vendorCode === filterVendor);
    }

    // 날짜별 필터
    if (filterDate !== 'all') {
      const today = new Date();
      const filterDateObj = new Date();
      
      if (filterDate === 'today') {
        filtered = filtered.filter(inv => inv.date === format(today, 'yyyy-MM-dd'));
      } else if (filterDate === 'week') {
        filterDateObj.setDate(today.getDate() - 7);
        filtered = filtered.filter(inv => new Date(inv.date) >= filterDateObj);
      } else if (filterDate === 'month') {
        filterDateObj.setMonth(today.getMonth() - 1);
        filtered = filtered.filter(inv => new Date(inv.date) >= filterDateObj);
      }
    }

    // 검색
    if (searchQuery) {
      filtered = filtered.filter(inv => 
        inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
    setUnreadCount(invoices.filter(inv => inv.status === 'unread').length);
  }, [invoices, filterVendor, filterDate, searchQuery]);

  const handleInvoiceClick = (invoiceId) => {
    navigate(`/hospital/invoice/${invoiceId}`);
  };

  const vendors = Array.from(
    new Map(invoices.map((inv) => [inv.vendorCode, { code: inv.vendorCode, name: inv.vendorName }])).values()
  );

  return (
    <div className="hospital-inbox">
      {/* 상태 위젯 - 미확인 건수 */}
      <div className="inbox-status-widget">
        <div className="status-widget-content">
          <div className="status-widget-text">
            <div className="status-widget-title">미확인 명세서</div>
            <div className="status-widget-count">{unreadCount}건</div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="inbox-filters">
        <div className="filter-group">
          <label>발행 업체</label>
          <select 
            className="select-field" 
            value={filterVendor} 
            onChange={e => setFilterVendor(e.target.value)}
          >
            <option value="all">전체</option>
            {vendors.map(v => (
              <option key={v.code} value={v.code}>{v.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>기간</label>
          <select 
            className="select-field" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)}
          >
            <option value="all">전체</option>
            <option value="today">오늘</option>
            <option value="week">최근 7일</option>
            <option value="month">최근 1개월</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <input
            type="text"
            className="input-field"
            placeholder="명세서 번호 또는 업체명 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 명세서 리스트 */}
      <div className="inbox-list">
        {loading ? (
          <div className="inbox-empty">
            <p>명세서 목록을 불러오는 중입니다.</p>
          </div>
        ) : error ? (
          <div className="inbox-empty">
            <p>{error}</p>
          </div>
        ) : (
        <>
        {filteredInvoices.length === 0 ? (
          <div className="inbox-empty">
            <p>명세서가 없습니다.</p>
          </div>
        ) : (
          filteredInvoices.map(invoice => (
            <div
              key={invoice.id}
              className={`inbox-item ${invoice.status === 'unread' ? 'unread' : ''}`}
              onClick={() => handleInvoiceClick(invoice.id)}
            >
              <div className="inbox-item-indicator">
                {invoice.status === 'unread' && <div className="unread-dot"></div>}
                {invoice.status === 'unread' && <span className="new-badge">신규</span>}
              </div>
              
              <div className="inbox-item-content">
                <div className="inbox-item-header">
                  <h3 className="inbox-item-title">{invoice.id}</h3>
                  <span className={`inbox-item-status status-${invoice.status}`}>
                    {invoice.status === 'unread' ? (invoice.version > 1 ? '수정본 도착' : '미확인') : 
                     invoice.status === 'confirmed' ? '확인완료' : 
                     invoice.status === 'disputed' ? '이의신청' : 
                     invoice.status === 'revised' ? '수정본' : invoice.status}
                  </span>
                  {invoice.version > 1 && (
                    <span className="revision-badge">v{invoice.version}</span>
                  )}
                </div>
                
                <div className="inbox-item-info">
                  <span className="inbox-item-vendor">{invoice.vendorName}</span>
                  <span className="inbox-item-date">{format(new Date(invoice.date), 'yyyy년 MM월 dd일')}</span>
                  <span className="inbox-item-items">{invoice.itemsCount}개 품목</span>
                </div>
                
                <div className="inbox-item-footer">
                  <span className="inbox-item-amount">
                    총액: {invoice.totalAmount.toLocaleString()}원
                  </span>
                  {invoice.parentInvoiceId && (
                    <span className="parent-invoice-link" style={{ 
                      fontSize: '12px', 
                      color: '#64748B',
                      marginLeft: '12px'
                    }}>
                      (원본: {invoice.parentInvoiceId})
                    </span>
                  )}
                </div>
                {invoice.revisionNote && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px', 
                    background: '#FEF3C7', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#92400E'
                  }}>
                    📝 {invoice.revisionNote}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default HospitalInbox;

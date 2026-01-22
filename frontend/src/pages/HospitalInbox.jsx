import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import notificationService from '../services/notificationService';
import invoiceStatusService from '../services/invoiceStatusService';
import '../css/HospitalInbox.css';

const HospitalInbox = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [filterVendor, setFilterVendor] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const applyStatuses = (list) => {
    const statusMap = invoiceStatusService.getAll();
    return list.map((inv) => ({
      ...inv,
      status: statusMap[inv.id] || inv.status,
    }));
  };

  // 임시 데이터 (실제로는 API에서 가져옴)
  useEffect(() => {
    const mockInvoices = [
      {
        id: 'INV-2024-001',
        vendorName: 'DH약품',
        vendorCode: 'dh-pharm',
        date: '2024-01-15',
        totalAmount: 1250000,
        status: 'unread', // unread, confirmed, disputed, revised
        items: 15,
        version: 1,
        parentInvoiceId: null
      },
      {
        id: 'INV-2024-002',
        vendorName: '서울제약',
        vendorCode: 'seoul-pharm',
        date: '2024-01-14',
        totalAmount: 980000,
        status: 'unread',
        items: 12,
        version: 1,
        parentInvoiceId: null
      },
      {
        id: 'INV-2024-003',
        vendorName: 'DH약품',
        vendorCode: 'dh-pharm',
        date: '2024-01-13',
        totalAmount: 2100000,
        status: 'confirmed',
        items: 25,
        version: 1,
        parentInvoiceId: null
      },
      {
        id: 'INV-2024-004',
        vendorName: '대한제약',
        vendorCode: 'daehan-pharm',
        date: '2024-01-12',
        totalAmount: 750000,
        status: 'disputed',
        items: 8,
        version: 1,
        parentInvoiceId: null
      },
      {
        id: 'INV-2024-004-v2',
        vendorName: '대한제약',
        vendorCode: 'daehan-pharm',
        date: '2024-01-13',
        totalAmount: 820000,
        status: 'unread',
        items: 10,
        version: 2,
        parentInvoiceId: 'INV-2024-004',
        revisionNote: '수량 및 품목 수정'
      },
    ];

    const withStatuses = applyStatuses(mockInvoices);

    setInvoices(withStatuses);
    setFilteredInvoices(withStatuses);
    const unread = withStatuses.filter(inv => inv.status === 'unread').length;
    setUnreadCount(unread);

    // 알림 권한 요청
    notificationService.init();

    // 새 명세서 시뮬레이션 (실제로는 WebSocket 또는 폴링)
    // 주석 해제하여 테스트 가능
    // setTimeout(() => {
    //   notificationService.notifyNewInvoice('INV-2024-005', '신규제약');
    // }, 5000);
  }, []);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === "invoice_statuses") {
        setInvoices((prev) => {
          const next = applyStatuses(prev);
          setFilteredInvoices(next);
          const unread = next.filter(inv => inv.status === 'unread').length;
          setUnreadCount(unread);
          return next;
        });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const refreshOnFocus = () => {
      setInvoices((prev) => {
        const next = applyStatuses(prev);
        setFilteredInvoices(next);
        const unread = next.filter(inv => inv.status === 'unread').length;
        setUnreadCount(unread);
        return next;
      });
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
        inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  }, [invoices, filterVendor, filterDate, searchQuery]);

  const handleInvoiceClick = (invoiceId) => {
    navigate(`/hospital/invoice/${invoiceId}`);
  };

  const vendors = [...new Set(invoices.map(inv => ({ code: inv.vendorCode, name: inv.vendorName })))];

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
                  <span className="inbox-item-items">{invoice.items}개 품목</span>
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
      </div>
    </div>
  );
};

export default HospitalInbox;

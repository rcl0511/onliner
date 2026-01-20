import React, { useState, useEffect, useMemo } from 'react';
import '../css/VendorOrdersManagement.css';
import '../css/common.css';

const VendorOrdersManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedOrders, setSelectedOrders] = useState(new Set());

    useEffect(() => {
        fetch('/vendor_orders.json')
            .then(res => res.json())
            .then(data => {
                setOrders(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
            const matchesSearch = !searchQuery || 
                o.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.id.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [orders, statusFilter, searchQuery]);

    const toggleSelect = (id) => {
        const next = new Set(selectedOrders);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedOrders(next);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ACCEPTED': return { background: '#E0E7FF', color: '#475BE8' };
            case 'PENDING': return { background: '#F1F5F9', color: '#64748B' };
            default: return { background: '#F1F5F9', color: '#94A3B8' };
        }
    };

    return (
        <div className="vom-container" style={{ background: 'white', padding: '32px', minHeight: 'calc(100vh - 48px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800, color: '#1E293B' }}>주문 통합 관리</h2>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>실시간 주문 현황 파악 및 배송 지시를 관리합니다.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text" 
                            placeholder="주문번호 또는 거래처 검색..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field"
                            style={{ width: '300px' }}
                        />
                    </div>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="select-field"
                    >
                        <option value="ALL">전체 상태</option>
                        <option value="PENDING">대기중</option>
                        <option value="ACCEPTED">수락됨</option>
                    </select>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>총 {filteredOrders.length}건의 주문</span>
                    {selectedOrders.size > 0 && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-small">일괄 수락 ({selectedOrders.size})</button>
                        </div>
                    )}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FFFFFF' }}>
                            <th style={{ width: '50px', padding: '16px' }}>
                                <input type="checkbox" onChange={(e) => {
                                    if (e.target.checked) setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
                                    else setSelectedOrders(new Set());
                                }} />
                            </th>
                            {['주문번호', '거래처', '주문일시', '금액', '상태', '관리'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '16px', fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((o) => (
                            <tr key={o.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <input type="checkbox" checked={selectedOrders.has(o.id)} onChange={() => toggleSelect(o.id)} />
                                </td>
                                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{o.id}</td>
                                <td style={{ padding: '16px', fontSize: '14px', color: '#1E293B' }}>{o.client}</td>
                                <td style={{ padding: '16px', fontSize: '14px', color: '#64748B' }}>{o.date}</td>
                                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{o.total?.toLocaleString()}원</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ 
                                        padding: '6px 12px', 
                                        borderRadius: '8px', 
                                        fontSize: '12px', 
                                        fontWeight: 700,
                                        ...getStatusStyle(o.status)
                                    }}>{o.status}</span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <button className="btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>상세보기</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VendorOrdersManagement;

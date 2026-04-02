import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authStorage from '../services/authStorage';
import API_BASE from '../api/baseUrl';
import '../css/VendorDashboard.css';
import '../css/common.css';

const VendorDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [todaySales, setTodaySales] = useState({});
    const [deliveryStats, setDeliveryStats] = useState({});
    const [lowStockItems, setLowStockItems] = useState([]);
    const [unconfirmedInvoices, setUnconfirmedInvoices] = useState(0);

    useEffect(() => {
        const token = authStorage.getToken();
        fetch(`${API_BASE}/api/dashboard/vendor`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((data) => {
                setTodaySales(data.todaySales || {});
                setDeliveryStats(data.deliveryStats || {});
                setLowStockItems(data.lowStockItems || []);
                setUnconfirmedInvoices(data.unconfirmedInvoices || 0);
            })
            .catch(() => {
                setDeliveryStats({ pending: 0, inProgress: 0, completed: 0 });
                setTodaySales({ totalSales: 0, changeRate: 0 });
            });
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case '수락': return '#475BE8';
            case '대기': return '#64748B';
            case '배송중': return '#475BE8';
            default: return '#94A3B8';
        }
    };

    return (
        <div className="vendor-dashboard-layout" style={{ background: 'white', padding: '32px', minHeight: 'calc(100vh - 48px)' }}>
            <div className="vendor-dashboard-widgets" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {[
                    { label: '오늘 매출', value: (todaySales?.totalSales ?? 0).toLocaleString() + '원', change: (todaySales?.changeRate >= 0 ? '+' : '') + (todaySales?.changeRate ?? 0) + '%', icon: '💰' },
                    { label: '배송 대기', value: (deliveryStats.pending + deliveryStats.inProgress) + '건', detail: `대기 ${deliveryStats.pending} / 진행 ${deliveryStats.inProgress}`, icon: '🚚' },
                    { label: '재고 부족', value: lowStockItems.length + '개', detail: '임계치 이하 품목', icon: '📦' },
                    { label: '미확인 명세서', value: unconfirmedInvoices + '건', detail: '확인 필요', icon: '📄' }
                ].map((w, i) => (
                    <div key={i} className="dashboard-widget" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 500, marginBottom: '12px' }}>{w.label}</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{w.value}</div>
                        {w.change && <div style={{ fontSize: '13px', color: '#475BE8', fontWeight: 600 }}>{w.change} <span style={{ color: '#94A3B8', fontWeight: 400 }}>vs yesterday</span></div>}
                        {w.detail && <div style={{ fontSize: '13px', color: '#64748B' }}>{w.detail}</div>}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>최근 주문 현황</h3>
                        <button onClick={() => navigate('/vendor/orders')} className="btn-outline" style={{ fontSize: '13px' }}>전체 보기</button>
                    </div>
                    <table className="vendor-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                                {['주문ID', '거래처', '담당자', '상태', '총액'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice(0, 5).map((o, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>{o.id}</td>
                                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#1E293B' }}>{o.client}</td>
                                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#64748B' }}>{o.manager}</td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: getStatusColor(o.status) + '15', color: getStatusColor(o.status), fontWeight: 700 }}>{o.status}</span>
                                    </td>
                                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#1E293B', fontWeight: 600 }}>{o.total?.toLocaleString()}원</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>재고 경고 품목</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {lowStockItems.map((item, idx) => (
                            <div key={idx} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>{item.code}</div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>{item.name}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#475BE8', fontWeight: 600 }}>재고: {item.stock}</span>
                                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>임계치: {item.threshold}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorDashboard;

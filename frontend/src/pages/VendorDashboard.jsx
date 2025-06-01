import React, { useEffect, useState } from 'react';
import '../css/VendorDashboard.css';

const VendorDashboard = () => {
    const user = JSON.parse(localStorage.getItem('userInfo')) || {};
    const [orders, setOrders] = useState([]);
    const [clients, setClients] = useState([]);
    const [todaySales, settodaySales] = useState({});

    useEffect(() => {
        fetch('/vendor_orders.json')
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(() => setOrders([]));

        fetch('/vendor_clients.json')
            .then(res => res.json())
            .then(data => setClients(data))
            .catch(() => setClients([]));

        fetch('/todaySales.json')
            .then(res => res.json())
            .then(data => settodaySales(data))
            .catch(() => settodaySales({}));
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case '수락': return '#10B981';
            case '대기': return '#F59E0B';
            case '배송중': return '#3B82F6';
            case '반려': return '#EF4444';
            default: return '#6B7280';
        }
    };

    return (
        <div className="vendor-dashboard-layout">
            {/* 왼쪽 - 주요 요약 */}
            <div className="vendor-dashboard-left">
                {/* 요약 카드 */}
                <div className="vendor-dashboard-summary-cards">
                    <div className="summary-card">
                        <div className="summary-label">오늘 신규 주문</div>
                        <div className="summary-value">{orders.length}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">등록 거래처</div>
                        <div className="summary-value">{clients.length}</div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">오늘 매출</div>
                        <div className="summary-value">
                            {todaySales?.totalSales
                                ? `${todaySales.totalSales.toLocaleString()}원`
                                : '0원'}
                        </div>
                    </div>
                </div>

                {/* 최근 주문 테이블 */}
                <div className="vendor-dashboard-table-block">
                    <div className="table-title">최근 주문 현황</div>
                    <table className="vendor-table">
                        <thead>
                            <tr>
                                <th>NO</th>
                                <th>주문ID</th>
                                <th>거래처</th>
                                <th>담당자</th>
                                <th>주문일자</th>
                                <th>상태</th>
                                <th>총액</th>
                            </tr>
                        </thead>
                        <tbody>
  {orders.map((order, idx) => (
    <tr key={order.id}>
      <td>{idx + 1}</td>
      <td>{order.id}</td>
      <td>{order.client}</td>
      <td>{order.manager}</td>
      <td>{order.date ? new Date(order.date).toLocaleString() : '-'}</td>
      <td style={{ color: getStatusColor(order.status), fontWeight: 'bold' }}>{order.status}</td>
      <td>
        {typeof order.total === 'number' 
          ? order.total.toLocaleString() + '원' 
          : '-'}
      </td>
    </tr>
  ))}
</tbody>
                    </table>
                </div>

                {/* 전체 주문 보기 */}
                <div className="vendor-dashboard-viewall-btn">
                    전체 주문 보기 ▶
                </div>
            </div>

            {/* 오른쪽 - 거래처, 공지 등 */}
            <div className="vendor-dashboard-right">
                {/* 거래처 요약 */}
                <div className="vendor-dashboard-table-block" style={{ minHeight: 220 }}>
                    <div className="table-title">주요 거래처(Top 5)</div>
                    <table className="vendor-table">
                        <thead>
                            <tr>
                                <th>거래처명</th>
                                <th>담당자</th>
                                <th>최근 주문일</th>
                                <th>누적주문</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.slice(0, 5).map((cli, idx) => (
                                <tr key={idx}>
                                    <td>{cli.name}</td>
                                    <td>{cli.manager}</td>
                                    <td>{cli.lastOrder}</td>
                                    <td>{cli.orderCount}건</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VendorDashboard;

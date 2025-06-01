import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/VendorOrdersManagement.css';

const VendorOrdersManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // 주문 목록 로드
    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            // 서버 완성 전까지 public/vendor_orders.json 사용
            const res = await fetch('/vendor_orders.json');
            if (!res.ok) throw new Error('주문 목록 조회 실패');
            const data = await res.json();
            setOrders(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // 주문 수락 처리 (여기선 예시용으로만 이동)
    const handleAccept = (order) => {
        navigate('/vendor/invoice', { state: { order } });
    };

    const pendingOrders = orders.filter(o => o.status === 'PENDING');

    return (
        <div className="vom-container">
            <h2 className="vom-title">주문 관리</h2>
            {loading && <p>주문 목록을 불러오는 중...</p>}
            {error && <p className="vom-error">에러: {error}</p>}

            {!loading && !error && (
                <table className="vom-table">
                    <thead>
                        <tr>
                            {['주문번호', '병원명', '제품명', '수량', '주문일', '상태', '동작'].map((th, idx) => (
                                <th key={idx}>{th}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pendingOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="vom-center">
                                    수락 대기 중인 주문이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            pendingOrders.map(order =>
                                order.items.map((item, i) => (
                                    <tr key={`${order._id}-${item.code}-${i}`}>
                                        {i === 0 && (
                                            <td rowSpan={order.items.length}>
                                                {order._id.slice(-6)}
                                            </td>
                                        )}
                                        {i === 0 && (
                                            <td rowSpan={order.items.length}>
                                                {order.client}
                                            </td>
                                        )}
                                        <td>{item.name}</td>
                                        <td>{item.qty}</td>
                                        {i === 0 && (
                                            <td rowSpan={order.items.length}>
                                                {order.date ? new Date(order.date).toLocaleString() : '-'}
                                            </td>
                                        )}
                                        {i === 0 && (
                                            <td rowSpan={order.items.length}>
                                                {order.status}
                                            </td>
                                        )}
                                        {i === 0 && (
                                            <td rowSpan={order.items.length}>
                                                <button
                                                    onClick={() => handleAccept(order)}
                                                    className="vom-btn-accept"
                                                >수락</button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default VendorOrdersManagement;

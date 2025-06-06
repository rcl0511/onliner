import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../css/VendorDelivery.css';

const VendorDelivery = () => {
    const location = useLocation();
    const { manual = [], auto = [] } = location.state || {};

    const [pdfList, setPdfList] = useState([...auto]);
    const [drivers, setDrivers] = useState([]);
    const [assignments, setAssignments] = useState({});

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/drivers');
            if (!res.ok) throw new Error('배송 기사 목록 조회 실패');
            const data = await res.json();
            setDrivers(data);

            const initial = {};
            data.forEach((d) => {
                initial[d.id] = [];
            });
            setAssignments(initial);
        } catch (err) {
            console.error(err);
            alert('배송 기사 목록을 불러오는 중 오류가 발생했습니다.');
        }
    };

    const handleDragStart = (e, pdf) => {
        e.dataTransfer.setData('application/json', JSON.stringify(pdf));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, driverId) => {
        e.preventDefault();
        try {
            const json = e.dataTransfer.getData('application/json');
            if (!json) return;
            const pdf = JSON.parse(json);

            const alreadyAssigned = assignments[driverId]?.includes(pdf.key);
            if (alreadyAssigned) {
                alert('이미 이 기사에게 할당된 PDF입니다.');
                return;
            }

            try {
                await assignPdfToDriver(driverId, pdf.key);
            } catch (err) {
                if (err.message.includes('409')) {
                    const confirmRes = window.confirm(
                        `이미 다른 기사에게 할당된 PDF입니다.\n[${driverId}] 기사에게 재할당하시겠습니까?`
                    );
                    if (!confirmRes) return;

                    // 재할당 API가 없다면, 기존 할당 삭제 API를 먼저 호출해야 함
                    // 여기선 그냥 사용자에게 안내만 함
                    alert('죄송합니다. 현재는 재할당을 지원하지 않습니다.\n관리자에게 문의해주세요.');
                    return;
                } else {
                    throw err;
                }
            }

            // 상태 업데이트
            setAssignments((prev) => {
                const updated = { ...prev };
                updated[driverId] = [...(updated[driverId] || []), pdf.key];
                return updated;
            });

            setPdfList((prev) => prev.filter((item) => item.key !== pdf.key));
        } catch (err) {
            console.error('할당 실패:', err);
            alert('❌ 할당 요청 중 오류가 발생했습니다.');
        }
    };

    const assignPdfToDriver = async (driverId, pdfKey) => {
        const body = { driverId, pdfKey };
        const res = await fetch('http://localhost:8080/api/delivery/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`서버 오류 ${res.status}: ${text}`);
        }
    };

    return (
        <div className="delivery-container">
            <h2 className="delivery-title">배송 관리</h2>

            <div className="delivery-flex">
                {/* 왼쪽 PDF 목록 */}
                <div className="pdf-list-area">
                    <h3 className="area-heading">생성된 PDF</h3>
                    {pdfList.length === 0 ? (
                        <p>할당되지 않은 PDF가 없습니다.</p>
                    ) : (
                        <div className="pdf-cards">
                            {pdfList.map((r) => {
                                const filename = r.originalName || r.pdfUrl.split('/').pop();
                                return (
                                    <div
                                        key={r.key}
                                        className="pdf-card"
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, r)}
                                    >
                                        <p className="pdf-name">{r.originalName}</p>
                                        <a
                                            href={`http://localhost:8080${r.pdfUrl}`} // 반드시 8080 포트에서 제공
                                            download={filename}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {filename}
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 오른쪽 배송 기사 목록 */}
                <div className="drivers-area">
                    <h3 className="area-heading">배송 기사</h3>
                    {drivers.length === 0 ? (
                        <p>배송 기사 정보가 없습니다.</p>
                    ) : (
                        <div className="driver-cards">
                            {drivers.map((d) => (
                                <div
                                    key={d.id}
                                    className="driver-card"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, d.id)}
                                >
                                    <p className="driver-name">{d.name}</p>
                                    <div className="assigned-pdfs">
                                        {assignments[d.id] && assignments[d.id].length > 0 ? (
                                            assignments[d.id].map((pdfKey) => {
                                                const pdfObj = auto.find((x) => x.key === pdfKey);
                                                if (!pdfObj) return null;
                                                const fname = pdfObj.originalName || pdfObj.pdfUrl.split('/').pop();
                                                return (
                                                    <div key={pdfKey} className="assigned-item">
                                                        <span className="assigned-name">{pdfObj.originalName}</span>
                                                        <a
                                                            href={pdfObj.pdfUrl}
                                                            download={fname}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="assigned-link"
                                                        >
                                                            [열기]
                                                        </a>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="no-assigned">할당된 PDF 없음</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorDelivery;

// src/pages/VendorDelivery.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import '../css/VendorDelivery.css';
import '../css/common.css';

const VendorDelivery = () => {
    const location = useLocation();
    const { auto = [], manual = [] } = location.state || {};
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);

    const [pdfList, setPdfList] = useState([...auto, ...manual]);
    const [drivers, setDrivers] = useState([]);
    const [assignments, setAssignments] = useState({});
    const [driverLocations, setDriverLocations] = useState({});
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showSignatureModal, setShowSignatureModal] = useState(null);

    // 구글 맵 API 키 (사용자 제공)
    const GOOGLE_MAPS_API_KEY = 'AIzaSyCeAo-v9T_jpuvDn8kwpWtl8f0KOnnLXuc';

    useEffect(() => {
        fetchDrivers();
        loadGoogleMaps();
        const interval = setInterval(fetchDriverLocations, 5000);
        return () => {
            clearInterval(interval);
            markersRef.current.forEach(marker => marker.setMap(null));
        };
    }, []);

    const loadGoogleMaps = () => {
        if (window.google && window.google.maps) {
            initMap();
            return;
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        document.head.appendChild(script);
    };

    const initMap = () => {
        if (!mapRef.current || !window.google) return;
        const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 37.5665, lng: 126.9780 },
            zoom: 12,
            disableDefaultUI: false,
            styles: [
                { featureType: "poi", stylers: [{ visibility: "off" }] },
                { featureType: "transit", stylers: [{ visibility: "off" }] }
            ]
        });
        mapInstanceRef.current = map;
        updateMarkers();
    };

    const updateMarkers = () => {
        if (!mapInstanceRef.current || !window.google) return;
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        Object.keys(driverLocations).forEach(driverId => {
            const loc = driverLocations[driverId];
            const driver = drivers.find(d => d.id.toString() === driverId);
            if (!driver || !loc) return;

            const marker = new window.google.maps.Marker({
                position: { lat: loc.lat, lng: loc.lng },
                map: mapInstanceRef.current,
                title: driver.name,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: loc.status === '배송중' ? '#475BE8' : '#64748B',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#FFFFFF'
                }
            });

            // Geocoding을 사용하여 주소 가져오기
            const geocoder = new window.google.maps.Geocoder();
            const infoWindow = new window.google.maps.InfoWindow({
                content: `<div style="padding:8px;min-width:200px;">
                    <strong style="font-size:14px;">${driver.name}</strong><br/>
                    <span style="font-size:12px;color:#64748B;">상태: ${loc.status}</span><br/>
                    <span style="font-size:12px;color:#475BE8;margin-top:4px;display:block;">주소 조회 중...</span>
                </div>`
            });
            
            // 주소 조회
            geocoder.geocode({ location: { lat: loc.lat, lng: loc.lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const address = results[0].formatted_address;
                    infoWindow.setContent(
                        `<div style="padding:8px;min-width:200px;">
                            <strong style="font-size:14px;">${driver.name}</strong><br/>
                            <span style="font-size:12px;color:#64748B;">상태: ${loc.status}</span><br/>
                            <span style="font-size:12px;color:#475BE8;margin-top:4px;display:block;">${address}</span>
                        </div>`
                    );
                } else {
                    infoWindow.setContent(
                        `<div style="padding:8px;min-width:200px;">
                            <strong style="font-size:14px;">${driver.name}</strong><br/>
                            <span style="font-size:12px;color:#64748B;">상태: ${loc.status}</span><br/>
                            <span style="font-size:12px;color:#94A3B8;margin-top:4px;display:block;">위도: ${loc.lat.toFixed(6)}, 경도: ${loc.lng.toFixed(6)}</span>
                        </div>`
                    );
                }
            });
            
            marker.infoWindow = infoWindow;

            marker.addListener('click', () => {
                infoWindow.open(mapInstanceRef.current, marker);
                setSelectedDriver(driver);
            });

            markersRef.current.push(marker);
        });
    };

    useEffect(() => {
        updateMarkers();
    }, [driverLocations, drivers]);

    const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

    const fetchDrivers = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/drivers`);
            const data = res.ok ? await res.json() : [];
            setDrivers(data);
            const initial = {};
            const mockLocs = {};
            data.forEach((d) => {
                initial[d.id] = [];
                mockLocs[d.id] = {
                    lat: 37.5665 + (Math.random() - 0.5) * 0.1,
                    lng: 126.9780 + (Math.random() - 0.5) * 0.1,
                    status: ['배송중', '대기중'][Math.floor(Math.random() * 2)]
                };
            });
            setAssignments(initial);
            setDriverLocations(mockLocs);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDriverLocations = () => {
        setDriverLocations(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(id => {
                updated[id] = {
                    ...updated[id],
                    lat: updated[id].lat + (Math.random() - 0.5) * 0.001,
                    lng: updated[id].lng + (Math.random() - 0.5) * 0.001
                };
            });
            return updated;
        });
    };

    const handleDragStart = (e, pdf) => e.dataTransfer.setData('application/json', JSON.stringify(pdf));
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = async (e, driverId) => {
        e.preventDefault();
        const json = e.dataTransfer.getData('application/json');
        if (!json) return;
        const pdf = JSON.parse(json);
        if (assignments[driverId]?.includes(pdf.key)) return;

        setAssignments(prev => ({
            ...prev,
            [driverId]: [...(prev[driverId] || []), pdf.key]
        }));
        setPdfList(prev => prev.filter(p => p.key !== pdf.key));
    };

    const getDeliveryCompletionRate = (driverId) => {
        const assigned = assignments[driverId] || [];
        if (assigned.length === 0) return 0;
        return 70; // Mock 70%
    };

    return (
        <div className="delivery-container">
            <div style={{ marginBottom: '32px' }}>
                <h2 className="delivery-title">배송 관리</h2>
                <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>실시간 배송 현황을 모니터링하고 배송 기사에게 명세서를 할당합니다.</p>
            </div>

            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: '1px solid #F1F5F9'
            }}>
                <h3 style={{ marginBottom: '16px', color: '#1E293B', fontSize: '18px' }}>실시간 배송 모니터링</h3>
                <div ref={mapRef} style={{ width: '100%', height: '450px', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#94A3B8' }}>
                    마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
                </div>
            </div>

            <div className="delivery-flex">
                <div className="pdf-list-area" style={{ background: '#F8FAFC', borderRadius: '12px', padding: '20px' }}>
                    <h3 className="area-heading" style={{ color: '#475BE8' }}>미할당 명세서</h3>
                    {pdfList.length === 0 ? <p style={{ color: '#94A3B8' }}>모든 명세서가 할당되었습니다.</p> : (
                        <div className="pdf-cards">
                            {pdfList.map((r) => (
                                <div key={r.key} className="pdf-card" draggable onDragStart={(e) => handleDragStart(e, r)} 
                                     style={{ background: 'white', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', marginBottom: '8px', cursor: 'grab' }}>
                                    <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>{r.originalName || r.fileName}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="drivers-area" style={{ flex: 1 }}>
                    <h3 className="area-heading" style={{ paddingLeft: '20px', fontSize: '18px' }}>배송 기사 목록</h3>
                    <div className="driver-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '0 20px' }}>
                        {drivers.map((d) => (
                            <div key={d.id} className="driver-card" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, d.id)}
                                 onClick={() => {
                                     setSelectedDriver(d);
                                     if (mapInstanceRef.current && driverLocations[d.id]) {
                                         mapInstanceRef.current.panTo({ lat: driverLocations[d.id].lat, lng: driverLocations[d.id].lng });
                                         mapInstanceRef.current.setZoom(15);
                                     }
                                 }}
                                 style={{ 
                                     background: 'white', 
                                     border: selectedDriver?.id === d.id ? '2px solid #475BE8' : '1px solid #E2E8F0',
                                     padding: '16px', 
                                     borderRadius: '12px',
                                     cursor: 'pointer',
                                     transition: 'all 0.2s'
                                 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '16px' }}>{d.name}</span>
                                    <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#475BE8', fontWeight: 600 }}>
                                        {driverLocations[d.id]?.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#64748B' }}>완료율: {getDeliveryCompletionRate(d.id)}%</div>
                                <div style={{ marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>할당된 명세서</p>
                                    {(assignments[d.id] || []).length === 0 ? <span style={{ fontSize: '12px', color: '#CBD5E1' }}>할당 없음</span> : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {assignments[d.id].map(k => <span key={k} style={{ fontSize: '11px', background: '#E3F2FD', color: '#475BE8', padding: '2px 6px', borderRadius: '4px' }}>{k}</span>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showSignatureModal && (
                <div className="modal-backdrop" onClick={() => setShowSignatureModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: '24px', borderRadius: '16px', maxWidth: '500px' }}>
                        <h3 style={{ marginTop: 0 }}>배송 확인 서명</h3>
                        <img src={showSignatureModal.signatureUrl} alt="서명" style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                        <button className="btn-primary" onClick={() => setShowSignatureModal(null)} style={{ width: '100%', marginTop: '20px' }}>닫기</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorDelivery;

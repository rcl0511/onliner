import React, { useState, useEffect } from "react";
import authStorage from "../services/authStorage";
import API_BASE from "../api/baseUrl";

export default function SettingsGeneral() {
  const user = authStorage.getUser();
  const companyCode = user.companyCode || '';
  const token = authStorage.getToken();
  const isMaster = user.permission === 'MASTER';

  const defaultSettings = {
    companyName: user.companyName || '',
    address: '',
    phone: '',
    email: '',
    businessNumber: '',
    representative: '',
    logoPath: null,
    sealPath: null,
  };
  const [settings, setSettings] = useState(defaultSettings);
  const [savedSettings, setSavedSettings] = useState(defaultSettings);
  const [logoFile, setLogoFile] = useState(null);
  const [sealFile, setSealFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [sealPreview, setSealPreview] = useState(null);
  const [savedLogoPreview, setSavedLogoPreview] = useState(null);
  const [savedSealPreview, setSavedSealPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!companyCode) return;

    let active = true;
    fetch(`${API_BASE}/api/vendors/${companyCode}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!active) {
          return;
        }
        const loaded = {
          companyName: data.companyName || user.companyName || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          businessNumber: data.businessNumber || '',
          representative: data.representative || '',
          logoPath: data.logoPath || null,
          sealPath: data.sealPath || null,
        };
        setSettings(loaded);
        setSavedSettings(loaded);
        const logo = data.logoPath ? `${API_BASE}${data.logoPath}` : null;
        const seal = data.sealPath ? `${API_BASE}${data.sealPath}` : null;
        setLogoPreview(logo);
        setSealPreview(seal);
        setSavedLogoPreview(logo);
        setSavedSealPreview(seal);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [companyCode, token, user.companyName]);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
      if (sealPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(sealPreview);
      }
    };
  }, [logoPreview, sealPreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'logo') {
      if (logoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogoFile(file);
      setLogoPreview(preview);
    } else {
      if (sealPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(sealPreview);
      }
      setSealFile(file);
      setSealPreview(preview);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      Object.entries(settings).forEach(([k, v]) => {
        if (v !== null && !k.endsWith('Path')) formData.append(k, v);
      });
      if (logoFile) formData.append('logo', logoFile);
      if (sealFile) formData.append('seal', sealFile);

      const res = await fetch(`${API_BASE}/api/vendors/${companyCode}/settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedSettings(settings);
      setSavedLogoPreview(logoPreview);
      setSavedSealPreview(sealPreview);
      setLogoFile(null);
      setSealFile(null);
      setSuccessMsg('설정이 저장되었습니다.');
    } catch (err) {
      setError('저장 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    fontSize: 14,
    color: '#1E293B',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontWeight: 600,
    fontSize: 13,
    color: '#475BE8',
  };

  const sectionStyle = {
    background: 'white',
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    border: '1px solid #E2E8F0',
  };

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>설정</h2>
      <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>업체 기본 정보와 PDF 명세서 설정을 관리합니다.</p>

      {!isMaster && (
        <div style={{ background: '#FFF7ED', color: '#D97706', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          마스터 관리자만 설정을 변경할 수 있습니다. 현재 읽기 전용입니다.
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#F0FDF4', color: '#10B981', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background: '#FEF2F2', color: '#EF4444', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginTop: 0, marginBottom: 20 }}>기본 정보</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { name: 'companyName', label: '업체명', type: 'text' },
              { name: 'representative', label: '대표자명', type: 'text' },
              { name: 'businessNumber', label: '사업자번호', type: 'text', placeholder: '000-00-00000' },
              { name: 'phone', label: '전화번호', type: 'text', placeholder: '02-0000-0000' },
              { name: 'email', label: '이메일', type: 'email' },
              { name: 'address', label: '주소', type: 'text' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label style={labelStyle}>{label}</label>
                <input
                  type={type}
                  name={name}
                  value={settings[name]}
                  onChange={handleChange}
                  disabled={!isMaster}
                  placeholder={placeholder}
                  style={{ ...inputStyle, background: isMaster ? '#fff' : '#F8FAFC' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginTop: 0, marginBottom: 20 }}>PDF 커스터마이징</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {[
              { key: 'logo', label: '로고 이미지', preview: logoPreview },
              { key: 'seal', label: '직인 이미지', preview: sealPreview },
            ].map(({ key, label, preview }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                {isMaster && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, key)}
                    style={{ marginBottom: 8, fontSize: 13 }}
                  />
                )}
                {preview ? (
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <img src={preview} alt={`${label} 미리보기`} style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ border: '2px dashed #E2E8F0', borderRadius: 8, padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                    이미지 없음
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {isMaster && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setSettings(savedSettings);
                setLogoFile(null);
                setSealFile(null);
                setLogoPreview(savedLogoPreview);
                setSealPreview(savedSealPreview);
              }}
              style={{ padding: '10px 24px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '10px 24px', background: '#475BE8', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

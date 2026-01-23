import React, { useState, useEffect } from "react";
import authStorage from "../services/authStorage";

export default function SettingsGeneral() {
  const user = authStorage.getUser();
  const companyCode = user.companyCode || '';
  
  const [settings, setSettings] = useState({
    companyName: user.companyName || '',
    logo: null,
    seal: null, // 직인 이미지
    logoPreview: null,
    sealPreview: null,
    address: '',
    phone: '',
    email: '',
    businessNumber: '',
    representative: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 실제로는 서버에서 설정 불러오기
    // fetch(`/api/vendors/${companyCode}/settings`)
  }, [companyCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'logo') {
      setSettings(prev => ({
        ...prev,
        logo: file,
        logoPreview: URL.createObjectURL(file)
      }));
    } else if (type === 'seal') {
      setSettings(prev => ({
        ...prev,
        seal: file,
        sealPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('companyName', settings.companyName);
      formData.append('address', settings.address);
      formData.append('phone', settings.phone);
      formData.append('email', settings.email);
      formData.append('businessNumber', settings.businessNumber);
      formData.append('representative', settings.representative);
      
      if (settings.logo) {
        formData.append('logo', settings.logo);
      }
      if (settings.seal) {
        formData.append('seal', settings.seal);
      }

      // 실제로는 서버 API 호출
      // await fetch(`/api/vendors/${companyCode}/settings`, {
      //   method: 'PUT',
      //   body: formData
      // });

      alert('설정이 저장되었습니다.');
    } catch (error) {
      alert('설정 저장 실패: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24, color: '#475BE8' }}>설정 관리</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
        {/* 기본 정보 */}
        <div style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 8, 
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: 16, color: '#333' }}>기본 정보</h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              업체명
            </label>
            <input
              type="text"
              name="companyName"
              value={settings.companyName}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #D1D5DB', 
                borderRadius: 4 
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              사업자번호
            </label>
            <input
              type="text"
              name="businessNumber"
              value={settings.businessNumber}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #D1D5DB', 
                borderRadius: 4 
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              대표자명
            </label>
            <input
              type="text"
              name="representative"
              value={settings.representative}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #D1D5DB', 
                borderRadius: 4 
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              주소
            </label>
            <input
              type="text"
              name="address"
              value={settings.address}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #D1D5DB', 
                borderRadius: 4 
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              전화번호
            </label>
            <input
              type="text"
              name="phone"
              value={settings.phone}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #D1D5DB', 
                borderRadius: 4 
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              이메일
            </label>
            <input
              type="email"
              name="email"
              value={settings.email}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #D1D5DB', 
                borderRadius: 4 
              }}
            />
          </div>
        </div>

        {/* 로고 및 직인 설정 */}
        <div style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 8, 
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: 16, color: '#333' }}>PDF 커스터마이징</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* 로고 업로드 */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                로고 이미지
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'logo')}
                style={{ marginBottom: 12 }}
              />
              {settings.logoPreview && (
                <div style={{ 
                  marginTop: 12, 
                  padding: 12, 
                  border: '1px solid #D1D5DB', 
                  borderRadius: 4,
                  textAlign: 'center'
                }}>
                  <img 
                    src={settings.logoPreview} 
                    alt="로고 미리보기" 
                    style={{ maxWidth: '100%', maxHeight: 150 }}
                  />
                </div>
              )}
              <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                PDF 명세서에 표시될 로고입니다.
              </p>
            </div>

            {/* 직인 업로드 */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                직인 이미지
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'seal')}
                style={{ marginBottom: 12 }}
              />
              {settings.sealPreview && (
                <div style={{ 
                  marginTop: 12, 
                  padding: 12, 
                  border: '1px solid #D1D5DB', 
                  borderRadius: 4,
                  textAlign: 'center'
                }}>
                  <img 
                    src={settings.sealPreview} 
                    alt="직인 미리보기" 
                    style={{ maxWidth: '100%', maxHeight: 150 }}
                  />
                </div>
              )}
              <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                PDF 명세서에 표시될 직인입니다.
              </p>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#E5E7EB',
              color: '#111827',
              border: 'none',
              borderRadius: 4,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: '#475BE8',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}

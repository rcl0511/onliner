// src/components/MedicineEditForm.jsx
import React, { useEffect, useState } from 'react';

const MedicineEditForm = ({ initialData, onCancel, onSaved }) => {
  const [formData, setFormData] = useState({
    supplier: '',
    manufacturer: '',
    name: '',
    spec: '',
    basePrice: '',
    location: '',
    prevStock: '',
    prevAmount: '',
    inQty: '',
    inAmount: '',
    outQty: '',
    outAmount: '',
    stockQty: '',
    purchasedQty: '',
    unitPrice: '',
    basePricePercent: '',
    stockAmount: '',
    basePriceCode: '',
    remarks: '',
    standardCode: '',
    productLocation: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      // 숫자는 문자열로 변환해서 input value에 넣어줌
      setFormData({
        supplier: initialData.supplier || '',
        manufacturer: initialData.manufacturer || '',
        name: initialData.name || '',
        spec: initialData.spec || '',
        basePrice: initialData.basePrice?.toString() || '0',
        location: initialData.location || '',
        prevStock: initialData.prevStock?.toString() || '0',
        prevAmount: initialData.prevAmount?.toString() || '0',
        inQty: initialData.inQty?.toString() || '0',
        inAmount: initialData.inAmount?.toString() || '0',
        outQty: initialData.outQty?.toString() || '0',
        outAmount: initialData.outAmount?.toString() || '0',
        stockQty: initialData.stockQty?.toString() || '0',
        purchasedQty: initialData.purchasedQty?.toString() || '0',
        unitPrice: initialData.unitPrice?.toString() || '0',
        basePricePercent: initialData.basePricePercent?.toString() || '0',
        stockAmount: initialData.stockAmount?.toString() || '0',
        basePriceCode: initialData.basePriceCode || '',
        remarks: initialData.remarks || '',
        standardCode: initialData.standardCode || '',
        productLocation: initialData.productLocation || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        ['basePrice','prevStock','prevAmount','inQty','inAmount','outQty','outAmount','stockQty','purchasedQty','unitPrice','basePricePercent','stockAmount']
          .includes(name) 
          ? value.replace(/[^0-9\.]/g, '') 
          : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      supplier: formData.supplier,
      manufacturer: formData.manufacturer,
      name: formData.name,
      spec: formData.spec,
      basePrice: parseFloat(formData.basePrice) || 0,
      location: formData.location,
      prevStock: parseFloat(formData.prevStock) || 0,
      prevAmount: parseFloat(formData.prevAmount) || 0,
      inQty: parseFloat(formData.inQty) || 0,
      inAmount: parseFloat(formData.inAmount) || 0,
      outQty: parseFloat(formData.outQty) || 0,
      outAmount: parseFloat(formData.outAmount) || 0,
      stockQty: parseFloat(formData.stockQty) || 0,
      purchasedQty: parseFloat(formData.purchasedQty) || 0,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      basePricePercent: parseFloat(formData.basePricePercent) || 0,
      stockAmount: parseFloat(formData.stockAmount) || 0,
      basePriceCode: formData.basePriceCode,
      remarks: formData.remarks,
      standardCode: formData.standardCode,
      productLocation: formData.productLocation
    };

    try {
      const updated = await onSaved(initialData.id, payload);
      alert('수정이 완료되었습니다.');
      setLoading(false);
      onCancel(); // 또는 onSaved 이후에 부모가 다시 목록을 불러오도록 처리
    } catch (err) {
      console.error(err);
      alert('수정 중 오류가 발생했습니다: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="vendor-stock-form-overlay">
      <div className="vendor-stock-form-container">
        <h3>재고 수정</h3>
        <form onSubmit={handleSubmit}>
          {/* 필요한 input 필드를 모두 나열하세요 */}
          <div className="form-group">
            <label>제품명</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>제조사</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>재고수량</label>
            <input
              type="number"
              name="stockQty"
              value={formData.stockQty}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>단가</label>
            <input
              type="number"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>표준코드</label>
            <input
              type="text"
              name="standardCode"
              value={formData.standardCode}
              onChange={handleChange}
            />
          </div>
          {/* … 나머지 필드들도 동일하게 추가 … */}

          <div className="form-buttons">
            <button type="submit" disabled={loading}>
              {loading ? '저장 중…' : '저장'}
            </button>
            <button type="button" onClick={onCancel} disabled={loading}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineEditForm;

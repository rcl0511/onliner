import React, { useRef, useState, useEffect } from 'react';
import '../css/SignaturePad.css';

const SignaturePad = ({ onSave, savedSignature }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 저장된 서명이 있으면 표시
    if (savedSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
      };
      img.src = savedSignature;
    }
  }, [savedSignature]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;

    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
    
    // 서명을 그리면 자동으로 저장
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    if (onSave) {
      onSave(signatureData);
    }
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    
    // onSave 콜백을 통해 명세서별로 저장 (로컬 스토리지 저장은 signatureService에서 처리)
    if (onSave) {
      onSave(signatureData);
    }
  };

  return (
    <div className="signature-pad-container">
      <div className="signature-pad-header">
        <h3>전자 서명</h3>
        <div className="signature-pad-actions">
          <button type="button" className="btn-outline" onClick={clear}>
            지우기
          </button>
          <button type="button" className="btn-primary" onClick={save}>
            서명 저장
          </button>
        </div>
      </div>
      
      <div className="signature-pad-wrapper">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="signature-pad-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      
      {!hasSignature && (
        <p className="signature-pad-hint">
          위 영역에 마우스나 터치로 서명해주세요
        </p>
      )}
    </div>
  );
};

export default SignaturePad;

// src/components/ExcelUpload.jsx
import React, { useState } from 'react';

const ExcelUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('엑셀 파일을 선택하세요.');
      return;
    }
    try {
      const message = await onUploadSuccess(file);
      alert(message);
      setFile(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="file-upload-area">
      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
      <button onClick={handleUpload}>업로드</button>
    </div>
  );
};

export default ExcelUpload;

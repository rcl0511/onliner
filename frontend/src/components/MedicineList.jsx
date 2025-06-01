// src/components/MedicineList.jsx
import React from 'react';

const MedicineList = ({ medicines, onEditClick }) => {
  return (
    <table className="vendor-stocks-table">
      <thead>
        <tr>
          <th>제품명</th>
          <th>코드</th>
          <th>제조사</th>
          <th>기준가</th>
          <th>재고수량</th>
          <th>표준코드</th>
          <th>액션</th>
        </tr>
      </thead>
      <tbody>
        {medicines.map((m) => (
          <tr key={m.id}>
            <td>{m.name}</td>
            <td>{m.code}</td>
            <td>{m.manufacturer}</td>
            <td>{m.basePrice?.toLocaleString()}</td>
            <td>{m.stockQty}</td>
            <td>{m.standardCode}</td>
            <td>
              <button onClick={() => onEditClick(m)}>수정</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default MedicineList;

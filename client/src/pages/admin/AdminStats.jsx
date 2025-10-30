// import { useEffect, useState } from 'react';
// import { api } from '../../services/api';

// export default function AdminStats() {
//     const [data, setData] = useState(null);
//     useEffect(() => { api('/stats/summary').then(setData).catch(console.error); }, []);
//     if (!data) return <div style={{ padding: 16 }}>Đang tải...</div>;
//     return (
//         <div style={{ padding: 16 }}>
//             <h2>Thống kê hệ thống</h2>
//             <div>Tổng số sân: {data.totalCourts}</div>
//             <div>Tổng lượt đặt: {data.totalBookings}</div>
//             <div>Doanh thu ước tính: {data.revenue?.toLocaleString()} đ</div>
//             <h3>Theo tháng</h3>
//             <ul>
//                 {Object.entries(data.byMonth).map(([k, v]) => <li key={k}>{k}: {v.toLocaleString()} đ</li>)}
//             </ul>
//         </div>
//     );
// }


import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './AdminStats.css';

export default function AdminStats() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/stats/summary').then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="admin-stats">Đang tải...</div>;

  return (
    <div className="admin-stats">
      <h2 className="page-title">Thống kê hệ thống</h2>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Tổng số sân</div>
          <div className="kpi-value">{data.totalCourts}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tổng lượt đặt</div>
          <div className="kpi-value">{data.totalBookings}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Doanh thu ước tính</div>
          <div className="kpi-value">{data.revenue?.toLocaleString('vi-VN')} đ</div>
        </div>
      </div>

      <h3 className="section-title">Theo tháng</h3>
      <ul className="month-list">
        {Object.entries(data.byMonth).map(([k, v]) => (
          <li className="month-item" key={k}>
            <span className="month">{k}</span>
            <span className="money">{v.toLocaleString('vi-VN')} đ</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
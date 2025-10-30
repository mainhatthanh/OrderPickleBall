// import { useEffect, useState } from 'react';
// import { api } from '../services/api';
// import './MyBookings.css';

// export default function MyBookings() {
//     const [items, setItems] = useState([]);
//     useEffect(() => { api('/bookings/me').then(setItems).catch(console.error); }, []);
//     return (
//         <div style={{ padding: 16 }}>
//             <h2>Lịch đã đặt</h2>
//             <table border="1" cellPadding="6">
//                 <thead><tr><th>Mã</th><th>Sân</th><th>Ngày</th><th>Giờ</th><th>Tiền</th><th>Trạng thái</th></tr></thead>
//                 <tbody>
//                     {items.map(x => (
//                         <tr key={x.id}>
//                             <td>{x.id}</td><td>{x.courtId}</td><td>{x.date}</td>
//                             <td>{x.startHour}-{x.endHour}</td>
//                             <td>{x.amount?.toLocaleString()}</td><td>{x.status}</td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );
// }

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './MyBookings.css'; // <— thêm

export default function MyBookings() {
  const [items, setItems] = useState([]);
  useEffect(() => { api('/bookings/me').then(setItems).catch(console.error); }, []);

  const fmt = (n) => (n ?? 0).toLocaleString('vi-VN');

  return (
    <div className="booking-history">
      <h2>Lịch đã đặt</h2>
      <div className="history-card">
        <table className="history-table">
          <thead>
            <tr>
              <th>Mã</th><th>Sân</th><th>Ngày</th><th>Giờ</th><th>Tiền</th><th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {items.map(x => (
              <tr key={x.id}>
                <td>{x.id}</td>
                <td>{x.courtId}</td>
                <td>{x.date}</td>
                <td>{x.startHour}-{x.endHour}</td>
                <td className="amount">{fmt(x.amount)} đ</td>
                <td>
                  <span className={`status ${x.status}`}>{x.status.replace('_',' ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
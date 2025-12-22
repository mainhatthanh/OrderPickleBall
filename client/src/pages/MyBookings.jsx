import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './MyBookings.css';

function normalizeStatus(s) {
  // Gộp pending_payment vào pending để "bỏ luôn" pending_payment trên UI
  if (s === 'pending_payment') return 'pending';
  return s;
}

function statusLabel(s) {
  // Bạn có thể đổi sang tiếng Việt cho đẹp:
  // if (s === 'pending') return 'Chờ duyệt';
  // if (s === 'confirmed') return 'Đã xác nhận';
  // if (s === 'rejected') return 'Từ chối';
  // if (s === 'cancelled') return 'Đã hủy';
  // return s;

  // Giữ tiếng Anh giống bạn đang có:
  return normalizeStatus(s).replace('_', ' ');
}

export default function MyBookings() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api('/bookings/me').then(setItems).catch(console.error);
  }, []);

  const fmt = (n) => (n ?? 0).toLocaleString('vi-VN');

  return (
    <div className="booking-history">
      <h2>Lịch đã đặt</h2>
      <div className="history-card">
        <table className="history-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên sân</th>
              <th>Địa chỉ</th>
              <th>Ngày</th>
              <th>Giờ</th>
              <th>Tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((x) => {
                const st = normalizeStatus(x.status);
                return (
                  <tr key={x.id}>
                    <td>{x.id}</td>
                    <td>{x.courtName || x.court?.name || x.courtId}</td>
                    <td>{x.courtAddress || '-'}</td>
                    <td>{x.date}</td>
                    <td>{x.startHour}-{x.endHour}</td>
                    <td className="amount">{fmt(x.amount)} đ</td>
                    <td>
                      <span className={`status ${st}`}>
                        {statusLabel(x.status)}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#666', padding: '12px' }}>
                  Chưa có lịch đặt nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

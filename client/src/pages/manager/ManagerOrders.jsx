import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './ManagerOrders.css';

export default function ManagerOrders() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setErr('');
      // chỉ lấy đơn pending để đúng usecase “duyệt minh chứng”
      const data = await api('/manager/orders?status=pending');
      setItems(data);
    } catch (e) {
      setErr(e.message || 'Lỗi tải danh sách đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (bookingId) => {
    if (!confirm(`Duyệt booking ${bookingId}?`)) return;
    try {
      await api('/manager/orders/approve', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
      alert('Đã duyệt booking!');
      load();
    } catch (e) {
      alert(e.message || 'Lỗi duyệt booking');
    }
  };

  const reject = async (bookingId) => {
    const reason = prompt('Nhập lý do từ chối (tuỳ chọn):', 'Minh chứng không hợp lệ');
    if (reason === null) return; // bấm cancel
    try {
      await api('/manager/orders/reject', {
        method: 'POST',
        body: JSON.stringify({ bookingId, reason }),
      });
      alert('Đã từ chối booking!');
      load();
    } catch (e) {
      alert(e.message || 'Lỗi từ chối booking');
    }
  };

  return (
    <div className="manager-orders">
      <h2>Đơn đặt sân (chờ duyệt minh chứng)</h2>

      {err && <div style={{ marginBottom: 10, color: 'crimson' }}>{err}</div>}
      {loading && <div style={{ marginBottom: 10 }}>Đang tải…</div>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Khách</th>
            <th>Tên sân</th>
            <th>Ngày</th>
            <th>Giờ</th>
            <th>Tiền</th>
            <th>Minh chứng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.map(x => (
            <tr key={x.id}>
              <td>{x.id}</td>
              <td>{x.userName || x.userId}</td>
              <td>{x.courtName}</td>
              <td>{x.date}</td>
              <td>{x.startHour}-{x.endHour}</td>
              <td>{x.amount?.toLocaleString('vi-VN')} đ</td>
              <td>
                {x.paymentProofUrl ? (
                  <a
                    href={x.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-link"
                  >
                    Xem
                  </a>
                ) : (
                  <span style={{ opacity: 0.7 }}>Chưa có</span>
                )}
              </td>
              <td>
                <button
                  className="btn btn-success"
                  onClick={() => approve(x.id)}
                  disabled={!x.paymentProofUrl}
                  style={{ marginRight: 8 }}
                >
                  Duyệt
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => reject(x.id)}
                  disabled={!x.paymentProofUrl}
                >
                  Từ chối
                </button>
              </td>
            </tr>
          ))}

          {items.length === 0 && !loading && (
            <tr>
              <td colSpan="8">Chưa có đơn Pending nào</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
        * Nút Duyệt/Từ chối chỉ bật khi đã có minh chứng.
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './ManagerRevenue.css';

export default function ManagerRevenue() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr('');
        const res = await api('/manager/revenue');
        setData(res);
      } catch (e) {
        setErr(e.message || 'Lỗi tải doanh thu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt = (n) => (Number(n) || 0).toLocaleString('vi-VN');

  return (
    <div className="manager-revenue">
      <h2>Doanh thu sân</h2>
      <p style={{ color: '#6b7280', marginTop: -6 }}>
        Tổng hợp tất cả booking <strong>đã xác nhận</strong>. (all-time)
      </p>

      {err && <div style={{ margin: '10px 0', color: 'crimson' }}>{err}</div>}
      {loading && <div style={{ margin: '10px 0' }}>Đang tải...</div>}

      {data && (
        <>
          <div className="revenue-summary">
            <div className="revenue-card">
              <div className="label">Tổng doanh thu</div>
              <div className="value">{fmt(data.totalAmount)} đ</div>
            </div>
            <div className="revenue-card">
              <div className="label">Số booking</div>
              <div className="value">{fmt(data.bookingCount)}</div>
            </div>
            <div className="revenue-card">
              <div className="label">Số sân (đã duyệt)</div>
              <div className="value">{data.totalActiveCourts ?? 0}</div>
            </div>
          </div>

          <table className="revenue-table">
            <thead>
              <tr>
                <th>Sân</th>
                <th>Booking</th>
                <th>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {data.breakdown?.map((row) => (
                <tr key={row.courtId}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{row.courtName}</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>{row.courtId}</div>
                  </td>
                  <td>
                    <span className="pill">{fmt(row.bookingCount)} booking</span>
                  </td>
                    <td style={{ fontWeight: 700 }}>{fmt(row.totalAmount)} đ</td>
                </tr>
              ))}
              {(!data.breakdown || data.breakdown.length === 0) && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
                    Chưa có doanh thu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

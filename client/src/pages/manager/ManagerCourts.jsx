import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './ManagerCourts.css';

// Default placeholder image
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=250&fit=crop&auto=format';

export default function ManagerCourts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      setErr('');
      const data = await api('/manager/courts');
      setItems(data);
    } catch (e) {
      setErr(e.message || 'Lỗi tải danh sách sân');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (court) => {
    const confirmMsg = `Bạn có chắc muốn xóa sân "${court.name}"?\n\nHành động này không thể hoàn tác!`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api(`/manager/courts/${court.id}`, { method: 'DELETE' });
      alert('Đã xóa sân thành công!');
      await load();
    } catch (err) {
      alert(err.message || 'Lỗi xóa sân');
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const fmt = (n) => Number(n).toLocaleString('vi-VN');

  return (
    <div className="manager-courts">
      <h2>Sân của tôi</h2>
      <p style={{ color: '#6b7280', marginTop: -8 }}>
        Hiển thị tất cả sân đã đăng ký (đã duyệt / chờ duyệt / bị từ chối). Muốn đăng ký sân mới, vào mục "Đăng ký sân".
      </p>

      {err && <div style={{ color: 'crimson', marginBottom: 10 }}>{err}</div>}
      {loading && <div style={{ marginBottom: 10 }}>Đang tải...</div>}

      <div className="court-list">
        {items.length === 0 ? (
          <p className="empty-msg">Chưa có sân nào được duyệt.</p>
        ) : (
          items.map((c) => (
            <div key={c.id} className={`court-item status-${c.status}`}>
              <div className="court-image-thumb">
                <img
                  src={c.imageUrl || DEFAULT_IMAGE}
                  alt={c.name}
                  onError={(e) => {
                    e.target.src = DEFAULT_IMAGE;
                  }}
                />
              </div>
              <div className="court-info">
                <b>{c.name}</b>
                <span className="address">📍 {c.address}</span>
                <span className="price">
                  💰 {fmt(c.pricePerHour)} đ/giờ
                  {c.hourlyPrices && Object.keys(c.hourlyPrices).length > 0 && (
                    <span className="custom-price-badge">+{Object.keys(c.hourlyPrices).length} khung giá riêng</span>
                  )}
                </span>
                {c.mapUrl && (
                  <a href={c.mapUrl} target="_blank" rel="noreferrer" className="map-link">
                    🗺️ Xem bản đồ
                  </a>
                )}
              </div>
              <div className="court-actions">
                <span className={`status-badge ${c.status}`}>
                  {c.status === 'active' ? 'Hoạt động' : c.status === 'pending' ? 'Chờ duyệt' : c.status === 'rejected' ? 'Từ chối' : c.status}
                </span>
                <div className="action-buttons">
                  <button
                    className="edit-btn"
                    onClick={() => nav(`/manager/register-court?courtId=${c.id}`)}
                    title="Chỉnh sửa sân (gửi duyệt lại nếu cần)"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(c)}
                    title="Xóa sân"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

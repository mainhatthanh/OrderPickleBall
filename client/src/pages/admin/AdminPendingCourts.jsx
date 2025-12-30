import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './AdminPendingCourts.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=250&fit=crop&auto=format';
const OPERATING_HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

export default function AdminPendingCourts() {
  const [items, setItems] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  
  const load = () => api('/admin/courts/pending').then(setItems);
  useEffect(() => { load().catch(console.error); }, []);

  const act = async (id, type) => {
    try {
      await api(`/admin/courts/${id}/${type}`, { method: 'POST' });
      setSelectedCourt(null);
      await load();
      alert(type === 'approve' ? 'Đã duyệt sân thành công!' : 'Đã từ chối sân!');
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'Không thể thực hiện'));
      console.error(err);
    }
  };

  const fmt = (n) => Number(n).toLocaleString('vi-VN');

  return (
    <div className="approval-page">
      <h2 className="approval-title">Sân chờ duyệt</h2>

      {items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <p>Không có sân nào chờ duyệt</p>
        </div>
      ) : (
        <div className="approval-list">
          {items.map(c => (
            <div key={c.id} className="court-card" onClick={() => setSelectedCourt(c)}>
              <div className="court-thumb">
                <img 
                  src={c.imageUrl || DEFAULT_IMAGE} 
                  alt={c.name}
                  onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                />
              </div>
              <div className="court-info">
                <div className="court-name">{c.name}</div>
                <div className="court-meta">
                  <span className="meta-chip">📍 {c.address || 'Chưa có địa chỉ'}</span>
                  <span className="meta-chip price">
                    {fmt(c.pricePerHour)} đ/giờ
                  </span>
                </div>
                <div className="click-hint">👆 Nhấn để xem chi tiết</div>
              </div>

              <div className="actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-approve" onClick={() => act(c.id, 'approve')}>Duyệt</button>
                <button className="btn btn-reject" onClick={() => act(c.id, 'reject')}>Từ chối</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chi tiết sân */}
      {selectedCourt && (
        <div className="court-modal-overlay" onClick={() => setSelectedCourt(null)}>
          <div className="court-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCourt(null)}>✕</button>
            
            <div className="modal-image">
              <img 
                src={selectedCourt.imageUrl || DEFAULT_IMAGE} 
                alt={selectedCourt.name}
                onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
              />
            </div>

            <div className="modal-content">
              <h3>{selectedCourt.name}</h3>
              
              <div className="modal-info-grid">
                <div className="info-item">
                  <span className="info-label">📍 Địa chỉ</span>
                  <span className="info-value">{selectedCourt.address || 'Chưa có'}</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">💰 Giá mặc định</span>
                  <span className="info-value">{fmt(selectedCourt.pricePerHour)} đ/giờ</span>
                </div>

                {selectedCourt.mapUrl && (
                  <div className="info-item full-width">
                    <span className="info-label">🗺️ Google Maps</span>
                    <a href={selectedCourt.mapUrl} target="_blank" rel="noreferrer" className="map-link">
                      Xem bản đồ →
                    </a>
                  </div>
                )}
              </div>

              {/* Bảng giá theo giờ */}
              {selectedCourt.hourlyPrices && Object.keys(selectedCourt.hourlyPrices).length > 0 && (
                <div className="hourly-prices-section">
                  <h4>⏰ Giá theo khung giờ</h4>
                  <div className="hourly-prices-grid">
                    {OPERATING_HOURS.map(hour => {
                      const customPrice = selectedCourt.hourlyPrices[hour];
                      const hasCustom = customPrice !== undefined;
                      return (
                        <div key={hour} className={`hour-price-item ${hasCustom ? 'custom' : ''}`}>
                          <span className="hour">{hour}:00</span>
                          <span className="price">
                            {hasCustom ? fmt(customPrice) : fmt(selectedCourt.pricePerHour)} đ
                            {hasCustom && <span className="custom-badge">🔥</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button className="btn btn-approve btn-lg" onClick={() => act(selectedCourt.id, 'approve')}>
                  ✅ Duyệt sân này
                </button>
                <button className="btn btn-reject btn-lg" onClick={() => act(selectedCourt.id, 'reject')}>
                  ❌ Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
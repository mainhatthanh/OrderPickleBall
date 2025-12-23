import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './AdminPendingCourts.css';

export default function AdminPendingCourts() {
  const [items, setItems] = useState([]);
  const load = () => api('/admin/courts/pending').then(setItems);
  useEffect(() => { load().catch(console.error); }, []);

  const act = async (id, type) => {
    await api(`/admin/courts/${id}/${type}`, { method: 'POST' });
    await load();
  };

  return (
    <div className="approval-page">
      <h2 className="approval-title">Sân chờ duyệt</h2>

      <div className="approval-list">
        {items.map(c => (
          <div key={c.id} className="court-card">
            <div className="court-info">
              <div className="court-name">{c.name}</div>
              <div className="court-meta">
                <span className="meta-chip">{c.address || 'Chưa có địa chỉ'}</span>
                <span className="meta-chip price">
                  {c.pricePerHour?.toLocaleString('vi-VN')} đ/giờ
                </span>
              </div>
            </div>

            <div className="actions">
              <button className="btn1 btn-approve" onClick={() => act(c.id, 'approve')}>Duyệt</button>
              <button className="btn1 btn-reject" onClick={() => act(c.id, 'reject')}>Từ chối</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
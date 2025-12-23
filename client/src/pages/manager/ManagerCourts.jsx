import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './ManagerCourts.css';

export default function ManagerCourts() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', address: '', pricePerHour: '' });

  // map status -> tiếng Việt
  const statusText = (s) => {
    const map = {
      active: 'Đã xác nhận',
      pending: 'Chờ duyệt',
      rejected: 'Từ chối',
    };
    return map[s] || s;
  };

  // load danh sách sân
  const load = () => api('/manager/courts').then(setItems);
  useEffect(() => {
    load().catch(console.error);
  }, []);

  // lưu sân mới
  const save = async () => {
    if (!form.name || !form.address || !form.pricePerHour) {
      alert('Vui lòng nhập đầy đủ thông tin sân.');
      return;
    }

    await api('/manager/courts/upsert', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        pricePerHour: Number(form.pricePerHour),
      }),
    });

    setForm({ name: '', address: '', pricePerHour: '' });
    await load();
    alert('Đã gửi duyệt');
  };

  return (
    <div className="manager-courts">
      <h2>Sân của tôi</h2>

      {/* Form thêm sân */}
      <div className="court-form">
        <input
          placeholder="Tên sân"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Địa chỉ"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <input
          type="number"
          placeholder="Giá/giờ"
          value={form.pricePerHour}
          onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
          step={50000}
          min={0}
        />
        <button onClick={save}>Gửi duyệt</button>
      </div>

      <hr />

      {/* Danh sách sân */}
      <div className="court-list">
        {items.length === 0 ? (
          <p>Chưa có sân nào được đăng ký.</p>
        ) : (
          items.map((c) => (
            <div key={c.id} className="court-item">
              <b>{c.name}</b>
              <span>{c.address}</span>
              <span>{c.pricePerHour?.toLocaleString('vi-VN')} đ/giờ</span>

              {/* ✅ Badge trạng thái */}
              <span className={`status-badge ${c.status}`}>
                {statusText(c.status)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

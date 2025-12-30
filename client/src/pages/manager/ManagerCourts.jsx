import { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import './ManagerCourts.css';

// Khung giờ hoạt động
const OPERATING_HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const PEAK_HOURS = [17, 18, 19, 20];

// Default placeholder image
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=250&fit=crop&auto=format';

export default function ManagerCourts() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ 
    name: '', 
    address: '', 
    pricePerHour: '',
    imageUrl: '',
    mapUrl: '',
  });
  const [hourlyPrices, setHourlyPrices] = useState({});
  const [showPricing, setShowPricing] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = () => api('/manager/courts').then(setItems);
  useEffect(() => {
    load().catch(console.error);
  }, []);

  // Update image preview
  useEffect(() => {
    setImagePreview(form.imageUrl || '');
  }, [form.imageUrl]);

  const resetForm = () => {
    setForm({ name: '', address: '', pricePerHour: '', imageUrl: '', mapUrl: '' });
    setHourlyPrices({});
    setShowPricing(false);
    setEditingCourt(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyPeakPricing = () => {
    const basePrice = Number(form.pricePerHour) || 100000;
    const peakPrice = Math.round(basePrice * 1.5);
    const newPrices = {};
    PEAK_HOURS.forEach(h => { newPrices[h] = peakPrice; });
    setHourlyPrices(newPrices);
  };

  const updateHourPrice = (hour, price) => {
    if (!price || price === form.pricePerHour) {
      const newPrices = { ...hourlyPrices };
      delete newPrices[hour];
      setHourlyPrices(newPrices);
    } else {
      setHourlyPrices({ ...hourlyPrices, [hour]: Number(price) });
    }
  };

  const startEdit = (court) => {
    setEditingCourt(court);
    setForm({
      name: court.name,
      address: court.address,
      pricePerHour: String(court.pricePerHour),
      imageUrl: court.imageUrl || '',
      mapUrl: court.mapUrl || '',
    });
    setHourlyPrices(court.hourlyPrices || {});
    setShowPricing(Object.keys(court.hourlyPrices || {}).length > 0);
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

  // Handle file upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh: JPG, PNG, WEBP, GIF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn. Tối đa 10MB.');
      return;
    }

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImagePreview(evt.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api('/manager/courts/upload-image', {
        method: 'POST',
        body: formData,
      });

      setForm({ ...form, imageUrl: res.imageUrl });
      alert('Upload ảnh thành công!');
    } catch (err) {
      alert(err.message || 'Lỗi upload ảnh');
      setImagePreview(form.imageUrl || '');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name || !form.address || !form.pricePerHour) {
      alert('Vui lòng nhập đầy đủ: Tên sân, Địa chỉ và Giá mặc định');
      return;
    }

    try {
      await api('/manager/courts/upsert', {
        method: 'POST',
        body: JSON.stringify({
          id: editingCourt?.id,
          name: form.name,
          address: form.address,
          pricePerHour: Number(form.pricePerHour),
          hourlyPrices: hourlyPrices,
          imageUrl: form.imageUrl.trim() || null,
          mapUrl: form.mapUrl.trim() || null,
        }),
      });

      resetForm();
      await load();
      alert(editingCourt ? 'Đã cập nhật sân!' : 'Đã gửi duyệt sân mới!');
    } catch (err) {
      alert(err.message || 'Lỗi lưu sân');
    }
  };

  const fmt = (n) => Number(n).toLocaleString('vi-VN');

  return (
    <div className="manager-courts">
      <h2>🏟️ Quản lý sân</h2>

      <div className="court-form">
        <h3>{editingCourt ? '✏️ Chỉnh sửa sân' : '➕ Thêm sân mới'}</h3>
        
        {/* Image Upload Section */}
        <div className="image-upload-section">
          <div className="image-preview">
            {uploading && (
              <div className="upload-overlay">
                <span className="spinner"></span>
                <span>Đang tải lên...</span>
              </div>
            )}
            <img 
              src={imagePreview || DEFAULT_IMAGE} 
              alt="Preview" 
              onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
            />
          </div>
          <div className="image-controls">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="file-input"
              id="court-image-input"
            />
            <label htmlFor="court-image-input" className="upload-btn">
              📷 {uploading ? 'Đang tải...' : 'Chọn ảnh từ máy'}
            </label>
            <div className="divider-text">hoặc</div>
            <input
              type="url"
              placeholder="Dán link ảnh (URL)"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="url-input"
            />
            <small>Hỗ trợ: JPG, PNG, WEBP, GIF (tối đa 10MB)</small>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>📛 Tên sân <span className="required">*</span></label>
            <input
              placeholder="VD: Pickle Arena Cầu Giấy"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>📍 Địa chỉ <span className="required">*</span></label>
            <input
              placeholder="VD: 123 Xuân Thủy, Cầu Giấy, Hà Nội"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>💰 Giá mặc định (đ/giờ) <span className="required">*</span></label>
            <input
              type="number"
              placeholder="VD: 120000"
              value={form.pricePerHour}
              onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
              step={10000}
              min={0}
            />
          </div>

          <div className="form-group">
            <label>🗺️ Link Google Maps</label>
            <input
              type="url"
              placeholder="https://maps.google.com/..."
              value={form.mapUrl}
              onChange={(e) => setForm({ ...form, mapUrl: e.target.value })}
            />
            <small>Mở Google Maps → Share → Copy Link</small>
          </div>
        </div>

        {/* Toggle giá theo khung giờ */}
        <button 
          type="button"
          className="toggle-pricing-btn"
          onClick={() => setShowPricing(!showPricing)}
        >
          {showPricing ? '📉 Ẩn bảng giá theo giờ' : '📊 Thiết lập giá theo khung giờ'}
        </button>

        {/* Bảng giá theo khung giờ */}
        {showPricing && (
          <div className="pricing-section">
            <div className="pricing-header">
              <h4>💰 Giá theo khung giờ</h4>
              <button 
                type="button" 
                className="quick-peak-btn"
                onClick={applyPeakPricing}
                disabled={!form.pricePerHour}
              >
                ⚡ Áp dụng cao điểm 17h-21h (+50%)
              </button>
            </div>
            
            <p className="pricing-hint">
              Để trống = dùng giá mặc định ({form.pricePerHour ? fmt(form.pricePerHour) + ' đ' : '---'})
            </p>

            <div className="hourly-grid">
              {OPERATING_HOURS.map(hour => {
                const isPeak = PEAK_HOURS.includes(hour);
                const hasCustomPrice = hourlyPrices[hour] !== undefined;
                
                return (
                  <div 
                    key={hour} 
                    className={`hour-item ${isPeak ? 'peak' : ''} ${hasCustomPrice ? 'custom' : ''}`}
                  >
                    <span className="hour-label">
                      {hour}:00 - {hour + 1}:00
                      {isPeak && <span className="peak-badge">🔥</span>}
                    </span>
                    <input
                      type="number"
                      placeholder={form.pricePerHour || '---'}
                      value={hourlyPrices[hour] ?? ''}
                      onChange={(e) => updateHourPrice(hour, e.target.value)}
                      step={10000}
                      min={0}
                    />
                  </div>
                );
              })}
            </div>

            {Object.keys(hourlyPrices).length > 0 && (
              <button 
                type="button" 
                className="clear-prices-btn"
                onClick={() => setHourlyPrices({})}
              >
                🗑️ Xóa tất cả giá tùy chỉnh
              </button>
            )}
          </div>
        )}

        <div className="form-actions">
          {editingCourt && (
            <button type="button" className="cancel-btn" onClick={resetForm}>
              Hủy
            </button>
          )}
          <button type="button" className="save-btn" onClick={save} disabled={uploading}>
            {editingCourt ? '💾 Cập nhật' : '📤 Gửi duyệt'}
          </button>
        </div>
      </div>

      <hr />

      {/* Danh sách sân */}
      <h3>📋 Sân đã đăng ký ({items.length})</h3>
      <div className="court-list">
        {items.length === 0 ? (
          <p className="empty-msg">Chưa có sân nào. Hãy thêm sân đầu tiên của bạn!</p>
        ) : (
          items.map((c) => (
            <div key={c.id} className={`court-item status-${c.status}`}>
              <div className="court-image-thumb">
                <img 
                  src={c.imageUrl || DEFAULT_IMAGE} 
                  alt={c.name}
                  onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                />
              </div>
              <div className="court-info">
                <b>{c.name}</b>
                <span className="address">📍 {c.address}</span>
                <span className="price">
                  💰 {fmt(c.pricePerHour)} đ/giờ
                  {c.hourlyPrices && Object.keys(c.hourlyPrices).length > 0 && (
                    <span className="custom-price-badge">
                      +{Object.keys(c.hourlyPrices).length} khung giá riêng
                    </span>
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
                  {c.status === 'active' ? '✅ Hoạt động' : 
                   c.status === 'pending' ? '⏳ Chờ duyệt' : 
                   c.status === 'rejected' ? '❌ Từ chối' : c.status}
                </span>
                <div className="action-buttons">
                  <button 
                    className="edit-btn"
                    onClick={() => startEdit(c)}
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

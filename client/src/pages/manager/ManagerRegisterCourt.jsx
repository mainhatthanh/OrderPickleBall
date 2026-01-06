import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import './ManagerCourts.css';

// Khung giờ hoạt động (6h-21h)
const OPERATING_HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const PEAK_HOURS = [17, 18, 19, 20];

// Ảnh mặc định
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=250&fit=crop&auto=format';

export default function ManagerRegisterCourt() {
  const [searchParams] = useSearchParams();
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

  // Update image preview when form.imageUrl changes (after upload)
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

  // Nếu được mở với ?courtId=... thì tự động bật chế độ sửa sân đó (sau khi load danh sách)
  useEffect(() => {
    const courtId = searchParams.get('courtId');
    if (!courtId || items.length === 0) return;
    const target = items.find((c) => c.id === courtId);
    if (target) {
      startEdit(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [items, searchParams]);

  // Handle file upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh: JPG, PNG, WEBP, GIF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn. Tối đa 10MB.');
      return;
    }

    // Preview ngay
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImagePreview(evt.target.result);
    };
    reader.readAsDataURL(file);

    // Upload
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
      <h2>Đăng ký sân</h2>

      <div className="court-form">
        <h3>{editingCourt ? 'Chỉnh sửa sân' : 'Thêm sân mới'}</h3>
        
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
              📁 {uploading ? 'Đang tải...' : 'Chọn ảnh từ máy'}
            </label>
            <small>Hỗ trợ: JPG, PNG, WEBP, GIF (tối đa 10MB)</small>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Tên sân <span className="required">*</span></label>
            <input
              placeholder="VD: Pickle Arena Cầu Giấy"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>Địa chỉ <span className="required">*</span></label>
            <input
              placeholder="VD: 123 Xuân Thủy, Cầu Giấy, Hà Nội"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>Giá mặc định (đ/giờ) <span className="required">*</span></label>
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
            <label>Link Google Maps</label>
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
          {showPricing ? 'Ẩn bảng giá theo giờ' : 'Thiết lập giá theo khung giờ'}
        </button>

        {/* Bảng giá theo khung giờ */}
        {showPricing && (
          <div className="pricing-section">
            <div className="pricing-header">
              <h4>Giá theo khung giờ</h4>
              <button 
                type="button" 
                className="quick-peak-btn"
                onClick={applyPeakPricing}
                disabled={!form.pricePerHour}
              >
                Áp dụng cao điểm 17h-21h (+50%)
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
                      {isPeak && <span className="peak-badge">★</span>}
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
                Xóa tất cả giá tùy chỉnh
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
            {editingCourt ? 'Cập nhật' : 'Gửi duyệt'}
          </button>
        </div>
      </div>

    </div>
  );
}

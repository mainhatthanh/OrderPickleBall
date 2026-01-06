import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { me } from '../services/auth';
import './CourtDetail.css';

// Các khung giờ hoạt động của sân (6h sáng - 22h tối)
const OPERATING_HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6-21 (kết thúc 22h)

// Default placeholder image
const DEFAULT_COURT_IMAGE = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=400&fit=crop&auto=format';

export default function CourtDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  
  // Check user role - only 'user' can book
  const user = me();
  const canBook = user?.role === 'user';

  const [court, setCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [hourlyPrices, setHourlyPrices] = useState({});
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Ngày hôm nay (min date)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  
  // Max date: 60 ngày từ hôm nay
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().slice(0, 10);
  }, []);

  // Tự động chọn ngày hôm nay khi load
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(today);
    }
  }, [today, selectedDate]);

  // Format ngày để hiển thị
  const formatSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate);
    const isToday = selectedDate === today;
    if (isToday) return 'Hôm nay';
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [selectedDate, today]);

  // Lấy thông tin sân
  useEffect(() => {
    let mounted = true;
    setErr('');
    api(`/courts/${id}`)
      .then((data) => mounted && setCourt(data))
      .catch((e) => mounted && setErr(e?.message || 'Không tải được dữ liệu'));
    return () => (mounted = false);
  }, [id]);

  // Lấy các slot đã đặt và giá theo giờ khi đổi ngày
  const fetchBookedSlots = useCallback(async () => {
    if (!selectedDate || !id) return;
    setLoadingSlots(true);
    try {
      const data = await api(`/bookings/slots/${id}?date=${selectedDate}`);
      setBookedSlots(data.bookedSlots || []);
      setHourlyPrices(data.hourlyPrices || {});
    } catch (e) {
      console.error('Lỗi lấy slots:', e);
      setBookedSlots([]);
      setHourlyPrices({});
    } finally {
      setLoadingSlots(false);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    fetchBookedSlots();
    setSelectedSlots([]);
  }, [fetchBookedSlots]);

  // Lấy giá cho 1 giờ cụ thể
  const getPriceForHour = useCallback((hour) => {
    if (hourlyPrices[hour] !== undefined) {
      return hourlyPrices[hour];
    }
    return court?.pricePerHour || 0;
  }, [hourlyPrices, court?.pricePerHour]);

  // Kiểm tra có phải giá cao điểm không
  const isPeakHour = useCallback((hour) => {
    const defaultPrice = court?.pricePerHour || 0;
    const hourPrice = getPriceForHour(hour);
    return hourPrice > defaultPrice;
  }, [court?.pricePerHour, getPriceForHour]);

  // Kiểm tra giờ đã được đặt chưa
  const isSlotBooked = useCallback((hour) => {
    return bookedSlots.some(slot => hour >= slot.startHour && hour < slot.endHour);
  }, [bookedSlots]);

  // Kiểm tra giờ đã qua chưa (cho ngày hôm nay)
  const isSlotPast = useCallback((hour) => {
    const today = new Date().toISOString().slice(0, 10);
    if (selectedDate !== today) return false;
    const currentHour = new Date().getHours();
    return hour <= currentHour;
  }, [selectedDate]);

  // Xử lý chọn/bỏ chọn slot
  const toggleSlot = (hour) => {
    if (isSlotBooked(hour) || isSlotPast(hour)) return;

    setSelectedSlots(prev => {
      if (prev.includes(hour)) {
        const sorted = [...prev].sort((a, b) => a - b);
        if (hour === sorted[0] || hour === sorted[sorted.length - 1]) {
          return prev.filter(h => h !== hour);
        }
        return prev;
      } else {
        if (prev.length === 0) return [hour];
        
        const sorted = [...prev].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        
        if (hour === min - 1 || hour === max + 1) {
          const newMin = Math.min(min, hour);
          const newMax = Math.max(max, hour);
          for (let h = newMin; h <= newMax; h++) {
            if (isSlotBooked(h) || isSlotPast(h)) return prev;
          }
          return [...prev, hour];
        }
        
        return [hour];
      }
    });
  };

  // Tính toán thông tin booking với chi tiết giá
  const bookingInfo = useMemo(() => {
    if (selectedSlots.length === 0) return null;
    const sorted = [...selectedSlots].sort((a, b) => a - b);
    
    // Tính tổng tiền và chi tiết giá
    let total = 0;
    const priceDetails = [];
    for (const hour of sorted) {
      const price = getPriceForHour(hour);
      total += price;
      priceDetails.push({ hour, price });
    }

    return {
      startHour: sorted[0],
      endHour: sorted[sorted.length - 1] + 1,
      duration: sorted.length,
      total,
      priceDetails
    };
  }, [selectedSlots, getPriceForHour]);

  // Xác nhận trước khi đặt (Recoverability + Minimal Surprise)
  const book = async () => {
    if (!bookingInfo) return;
    
    // Confirmation dialog
    const confirmMsg = `Xác nhận đặt sân?\n\n` +
      `📍 ${court.name}\n` +
      `📅 ${new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}\n` +
      `⏰ ${bookingInfo.startHour}:00 - ${bookingInfo.endHour}:00\n` +
      `💰 Tổng: ${fmt(bookingInfo.total)} đ`;
    
    if (!window.confirm(confirmMsg)) return;
    
    setLoading(true);
    setErr('');
    try {
      const { draft, payment } = await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          courtId: id,
          date: selectedDate,
          startHour: bookingInfo.startHour,
          endHour: bookingInfo.endHour,
        }),
      });

      const draftId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem(
        `payment-info:${draftId}`,
        JSON.stringify({ draftId, draft, payment })
      );
      nav(`/checkout/${draftId}`);
    } catch (e) {
      setErr(e?.message || 'Đặt sân thất bại. Vui lòng thử lại hoặc chọn khung giờ khác.');
      fetchBookedSlots(); // Refresh slots to show updated availability
    } finally {
      setLoading(false);
    }
  };

  // Clear selection (Recoverability)
  const clearSelection = () => {
    setSelectedSlots([]);
  };

  // Format giá
  const fmt = (n) => Number(n).toLocaleString('vi-VN');

  if (!court) {
    return (
      <div className="court-detail">
        {err ? <div className="form-error">{err}</div> : <div className="loading-spinner">Đang tải...</div>}
      </div>
    );
  }

  return (
    <div className="court-detail">
      {/* Back button (Recoverability) */}
      <button className="back-btn" onClick={() => nav('/')} title="Quay lại danh sách sân">
        ← Quay lại
      </button>

      {/* Step indicator (Learnability) */}
      <div className="booking-steps">
        <div className={`step ${selectedDate ? 'completed' : 'active'}`}>
          <span className="step-num">1</span>
          <span className="step-label">Chọn ngày</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${selectedSlots.length > 0 ? 'completed' : selectedDate ? 'active' : ''}`}>
          <span className="step-num">2</span>
          <span className="step-label">Chọn giờ</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${bookingInfo ? 'active' : ''}`}>
          <span className="step-num">3</span>
          <span className="step-label">Xác nhận</span>
        </div>
      </div>

      {/* Header sân với ảnh */}
      <div className="court-header">
        <div className="court-image">
          <img 
            src={court.imageUrl || DEFAULT_COURT_IMAGE} 
            alt={court.name}
            onError={(e) => { e.target.src = DEFAULT_COURT_IMAGE; }}
          />
          <div className="image-overlay">
            <span className="base-price">Từ {fmt(court.pricePerHour)} đ/giờ</span>
          </div>
        </div>
        <div className="court-info-header">
          <h2>{court.name}</h2>
          <div className="meta">
            <span className="location-icon">📍</span>
            {court.address}
          </div>
          {court.mapUrl && (
            <a 
              href={court.mapUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="map-link"
            >
              🗺️ Xem trên Google Maps
            </a>
          )}
        </div>
      </div>

      {/* Chọn ngày */}
      <div className="date-picker-section">
        <h3>📅 Chọn ngày</h3>
        <div className="date-picker-wrapper">
          <div className="date-input-group">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              max={maxDate}
              className="date-input"
            />
            <span className="date-display">
              {formatSelectedDate}
            </span>
          </div>
          <div className="date-quick-picks">
            <button 
              className={`quick-date-btn ${selectedDate === today ? 'active' : ''}`}
              onClick={() => setSelectedDate(today)}
            >
              Hôm nay
            </button>
            {[1, 2, 3, 7, 14].map(days => {
              const d = new Date();
              d.setDate(d.getDate() + days);
              const dateStr = d.toISOString().slice(0, 10);
              const label = days === 1 ? 'Ngày mai' : 
                           days === 7 ? '1 tuần nữa' : 
                           days === 14 ? '2 tuần nữa' :
                           `+${days} ngày`;
              return (
                <button
                  key={days}
                  className={`quick-date-btn ${selectedDate === dateStr ? 'active' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chọn khung giờ */}
      <div className="time-slots-section">
        <h3>⏰ Chọn khung giờ</h3>
        <div className="legend">
          <span className="legend-item"><span className="dot available"></span>Trống</span>
          <span className="legend-item"><span className="dot selected"></span>Đang chọn</span>
          <span className="legend-item"><span className="dot booked"></span>Đã đặt</span>
          <span className="legend-item"><span className="dot peak"></span>Cao điểm</span>
        </div>

        {loadingSlots ? (
          <div className="loading-slots">Đang tải lịch...</div>
        ) : (
          <div className="time-slots-grid">
            {OPERATING_HOURS.map((hour) => {
              const booked = isSlotBooked(hour);
              const past = isSlotPast(hour);
              const selected = selectedSlots.includes(hour);
              const peak = isPeakHour(hour);
              const disabled = booked || past;
              const price = getPriceForHour(hour);

              return (
                <button
                  key={hour}
                  className={`time-slot ${selected ? 'selected' : ''} ${booked ? 'booked' : ''} ${past ? 'past' : ''} ${peak && !booked && !past ? 'peak' : ''}`}
                  onClick={() => toggleSlot(hour)}
                  disabled={disabled}
                  title={booked ? 'Đã có người đặt' : past ? 'Đã qua giờ' : `${hour}:00 - ${hour + 1}:00 | ${fmt(price)} đ`}
                >
                  <span className="slot-time">{hour}:00</span>
                  <span className="slot-price">
                    {booked ? 'Đã đặt' : past ? 'Qua giờ' : `${fmt(price)}đ`}
                  </span>
                  {peak && !booked && !past && <span className="peak-indicator">🔥</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tóm tắt booking */}
      {bookingInfo && (
        <div className="booking-summary">
          <div className="summary-header">
            <span className="summary-icon">🎾</span>
            <span>Chi tiết đặt sân</span>
            {/* Clear selection button (Recoverability) */}
            <button 
              className="clear-selection-btn" 
              onClick={clearSelection}
              title="Bỏ chọn tất cả khung giờ"
            >
              ✕ Bỏ chọn
            </button>
          </div>
          <div className="summary-details">
            <div className="summary-row">
              <span>Sân:</span>
              <strong>{court.name}</strong>
            </div>
            <div className="summary-row">
              <span>Ngày:</span>
              <strong>{new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            </div>
            <div className="summary-row">
              <span>Khung giờ:</span>
              <strong>{bookingInfo.startHour}:00 - {bookingInfo.endHour}:00</strong>
            </div>
            <div className="summary-row">
              <span>Thời lượng:</span>
              <strong>{bookingInfo.duration} giờ</strong>
            </div>
            
            {/* Chi tiết giá từng giờ */}
            <div className="price-breakdown">
              <span className="breakdown-title">Chi tiết giá:</span>
              <div className="breakdown-list">
                {bookingInfo.priceDetails.map(({ hour, price }) => (
                  <div key={hour} className={`breakdown-item ${isPeakHour(hour) ? 'peak' : ''}`}>
                    <span>{hour}:00-{hour + 1}:00</span>
                    <span>{fmt(price)} đ {isPeakHour(hour) && '🔥'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="summary-row total">
              <span>Tổng tiền:</span>
              <strong>{fmt(bookingInfo.total)} đ</strong>
            </div>
          </div>
        </div>
      )}

      {/* Error message with recovery hint (User Guidance + Recoverability) */}
      {err && (
        <div className="form-error">
          <span className="error-icon">⚠️</span>
          <div className="error-content">
            <p>{err}</p>
            <button className="retry-btn" onClick={fetchBookedSlots}>
              🔄 Tải lại lịch
            </button>
          </div>
        </div>
      )}

      {/* Nút đặt sân - chỉ hiện cho role 'user' */}
      {canBook ? (
        <button
          className="book-btn"
          onClick={book}
          disabled={!bookingInfo || loading}
          title={!bookingInfo ? 'Hãy chọn ít nhất 1 khung giờ để tiếp tục' : `Đặt sân với tổng ${fmt(bookingInfo.total)} đ`}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Đang xử lý...
            </>
          ) : bookingInfo ? (
            <>Tiếp tục thanh toán - {fmt(bookingInfo.total)} đ</>
          ) : (
            'Vui lòng chọn khung giờ'
          )}
        </button>
      ) : (
        <div className="role-notice">
          <div className="notice-icon">👀</div>
          <div className="notice-text">
            <strong>Chế độ xem</strong>
            <span>Tài khoản {user?.role === 'admin' ? 'Admin' : 'Manager'} chỉ có thể xem thông tin sân. Để đặt sân, vui lòng đăng nhập bằng tài khoản Người dùng.</span>
          </div>
        </div>
      )}

      {/* User guidance section (Learnability + User Guidance) */}
      <div className="help-section">
        <details className="help-accordion">
          <summary>❓ Hướng dẫn đặt sân</summary>
          <div className="help-content">
            <div className="help-item">
              <strong>Bước 1:</strong> Chọn ngày bạn muốn chơi từ lịch hoặc nút chọn nhanh
            </div>
            <div className="help-item">
              <strong>Bước 2:</strong> Nhấn vào các ô giờ trống (màu trắng) để chọn. Nhấn các ô liên tiếp để đặt nhiều giờ.
            </div>
            <div className="help-item">
              <strong>Bước 3:</strong> Kiểm tra thông tin và nhấn "Tiếp tục thanh toán"
            </div>
            <div className="help-item help-note">
              <span>🔥</span> = Giờ cao điểm (giá cao hơn) &nbsp;|&nbsp;
              <span style={{color: '#ef4444'}}>■</span> = Đã có người đặt
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

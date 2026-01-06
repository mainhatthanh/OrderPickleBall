import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import './MyBookings.css';

function normalizeStatus(s) {
  if (s === 'pending_payment') return 'pending';
  return s;
}

function statusLabel(s) {
  const labels = {
    pending: 'Chờ duyệt',
    confirmed: 'Đã xác nhận',
    rejected: 'Từ chối',
    cancelled: 'Đã hủy'
  };
  return labels[normalizeStatus(s)] || normalizeStatus(s).replace('_', ' ');
}

// Lấy số ngày trong tháng
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Lấy ngày trong tuần (0 = CN, 1 = T2, ...)
function getDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

export default function MyBookings() {
  const [items, setItems] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // State cho calendar
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  useEffect(() => {
    api('/bookings/me').then(setItems).catch(console.error);
  }, []);

  const fmt = (n) => (n ?? 0).toLocaleString('vi-VN');

  // Lọc pending bookings
  const pendingBookings = useMemo(() => {
    return items.filter(b => normalizeStatus(b.status) === 'pending');
  }, [items]);

  // Lọc confirmed bookings và nhóm theo ngày
  const confirmedByDate = useMemo(() => {
    const map = {};
    items.filter(b => normalizeStatus(b.status) === 'confirmed').forEach(booking => {
      if (!map[booking.date]) {
        map[booking.date] = [];
      }
      map[booking.date].push(booking);
    });
    return map;
  }, [items]);

  // Tạo grid lịch
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const startDayOfWeek = getDayOfWeek(currentYear, currentMonth);

    const days = [];

    // Thêm các ô trống cho những ngày trước ngày 1
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, date: null });
    }

    // Thêm các ngày trong tháng
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        bookings: confirmedByDate[dateStr] || [],
        isToday: dateStr === today.toISOString().slice(0, 10)
      });
    }

    return days;
  }, [currentYear, currentMonth, confirmedByDate, today]);

  // Navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  return (
    <div className="booking-history">
      <h2>📋 Lịch đặt của tôi</h2>

      {/* Pending Bookings Section */}
      {pendingBookings.length > 0 && (
        <div className="pending-section">
          <h3>⏳ Đang chờ duyệt ({pendingBookings.length})</h3>
          <div className="pending-list">
            {pendingBookings.map(b => (
              <div key={b.id} className="pending-item" onClick={() => setSelectedBooking(b)}>
                <div className="pending-info">
                  <span className="court-name">{b.courtName || b.courtId}</span>
                  <span className="pending-meta">
                    📅 {b.date} • ⏰ {b.startHour}:00 - {b.endHour}:00 • 💰 {fmt(b.amount)} đ
                  </span>
                  {b.courtAddress && <span className="address">📍 {b.courtAddress}</span>}
                </div>
                <div className="pending-right">
                  <span className="pending-badge">Chờ duyệt</span>
                  <span className="view-detail-hint">Nhấn để xem chi tiết →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Section - Confirmed Bookings Only */}
      <div className="calendar-section">
        <h3>✅ Lịch đã xác nhận</h3>

        {/* Calendar Header */}
        <div className="calendar-header">
          <button className="nav-btn" onClick={prevMonth}>‹</button>
          <div className="month-year">
            <span className="month">{MONTHS[currentMonth]}</span>
            <span className="year">{currentYear}</span>
          </div>
          <button className="nav-btn" onClick={nextMonth}>›</button>
          <button className="today-btn" onClick={goToToday}>Hôm nay</button>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Weekday headers */}
          {WEEKDAYS.map(day => (
            <div key={day} className="weekday-header">{day}</div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((dayInfo, idx) => (
            <div
              key={idx}
              className={`calendar-day ${!dayInfo.day ? 'empty' : ''} ${dayInfo.isToday ? 'today' : ''} ${dayInfo.bookings?.length > 0 ? 'has-bookings' : ''}`}
            >
              {dayInfo.day && (
                <>
                  <span className="day-number">{dayInfo.day}</span>
                  {dayInfo.bookings?.length > 0 && (
                    <div className="day-bookings">
                      {dayInfo.bookings.map((b, i) => (
                        <div key={i} className="day-booking-card">
                          <div className="booking-court-name">{b.courtName || b.courtId}</div>
                          <div className="booking-time">{b.startHour}:00-{b.endHour}:00</div>
                          <div className="booking-price">{fmt(b.amount)}đ</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal chi tiết booking */}
      {selectedBooking && (
        <div className="booking-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedBooking(null)}>✕</button>

            <div className="modal-header">
              <h3>Chi tiết đơn đặt sân</h3>
              <span className={`status-badge ${normalizeStatus(selectedBooking.status)}`}>
                {statusLabel(selectedBooking.status)}
              </span>
            </div>

            <div className="modal-content">
              {/* Thông tin sân */}
              <div className="info-section">
                <h4>🏟️ Thông tin sân</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Tên sân</span>
                    <span className="value">{selectedBooking.courtName || selectedBooking.courtId}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Địa chỉ</span>
                    <span className="value">{selectedBooking.courtAddress || 'Không rõ'}</span>
                  </div>
                </div>
              </div>

              {/* Thông tin đặt */}
              <div className="info-section">
                <h4>📅 Thông tin đặt</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Ngày</span>
                    <span className="value">{new Date(selectedBooking.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Khung giờ</span>
                    <span className="value">{selectedBooking.startHour}:00 - {selectedBooking.endHour}:00</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Tổng tiền</span>
                    <span className="value price">{fmt(selectedBooking.amount)} đ</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Mã đơn</span>
                    <span className="value code">{selectedBooking.id}</span>
                  </div>
                </div>
              </div>

              {/* Liên hệ chủ sân */}
              <div className="info-section contact-section">
                <h4>📞 Liên hệ chủ sân</h4>
                {selectedBooking.ownerPhone ? (
                  <div className="contact-info">
                    <a href={`tel:${selectedBooking.ownerPhone}`} className="phone-link">
                      📱 {selectedBooking.ownerPhone}
                    </a>
                    <span className="contact-hint">Nhấn để gọi điện</span>
                  </div>
                ) : (
                  <p className="no-contact">Chủ sân chưa cập nhật số điện thoại</p>
                )}
              </div>

              {/* Ảnh minh chứng */}
              {selectedBooking.paymentProofUrl && (
                <div className="info-section">
                  <h4>🧾 Minh chứng thanh toán</h4>
                  <div className="proof-image">
                    <img
                      src={selectedBooking.paymentProofUrl}
                      alt="Minh chứng thanh toán"
                      onClick={() => window.open(selectedBooking.paymentProofUrl, '_blank')}
                    />
                    <span className="proof-hint">Nhấn để xem ảnh lớn</span>
                  </div>
                </div>
              )}

              {/* Lý do từ chối (nếu có) */}
              {selectedBooking.rejectReason && (
                <div className="info-section reject-section">
                  <h4>❌ Lý do từ chối</h4>
                  <p className="reject-reason">{selectedBooking.rejectReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

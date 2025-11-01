import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './CourtDetail.css'; // ← thêm dòng này

export default function CourtDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [court, setCourt] = useState(null);
  const [date, setDate] = useState('');
  const [startHour, setStart] = useState('');
  const [endHour, setEnd] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // lấy thông tin sân
  useEffect(() => {
    let mounted = true;
    setErr('');
    api(`/courts/${id}`)
      .then((data) => mounted && setCourt(data))
      .catch((e) => mounted && setErr(e?.message || 'Không tải được dữ liệu'));
    return () => (mounted = false);
  }, [id]);

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // thời lượng và tổng tiền
  const pricePerHour = court?.pricePerHour ?? 0;
  const duration = useMemo(() => {
    const s = Number(startHour);
    const e = Number(endHour);
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 0;
    return e - s; // đang dùng đơn vị giờ nguyên
  }, [startHour, endHour]);

  const total = duration * pricePerHour;

  // điều kiện vô hiệu nút
  const invalid =
    !date ||
    Number.isNaN(Number(startHour)) ||
    Number.isNaN(Number(endHour)) ||
    Number(startHour) < 0 ||
    Number(endHour) > 24 ||
    Number(startHour) >= Number(endHour);

  const book = async () => {
    if (invalid) return;
    setLoading(true);
    setErr('');
    try {
      const { booking, payment } = await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          courtId: id,
          date,
          startHour: Number(startHour),
          endHour: Number(endHour),
        }),
      });
      sessionStorage.setItem(
        'payment-info',
        JSON.stringify({ booking, payment })
      );
      nav(`/checkout/${booking.id}`);
    } catch (e) {
      setErr(e?.message || 'Đặt sân thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!court) {
    return (
      <div className="court-detail">
        {err ? <div className="form-error">{err}</div> : 'Đang tải...'}
      </div>
    );
  }

  return (
    <div className="court-detail">
      <h2>{court.name}</h2>
      <div className="meta">{court.address}</div>
      <div className="price">
        Giá: {pricePerHour.toLocaleString('vi-VN')} đ/giờ
      </div>
      <hr />
      <h3>Đặt sân</h3>

      <div className="booking-form">
        <label>
          Ngày
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            min={today}
          />
        </label>

        <label>
          Từ giờ
          <input
            type="number"
            value={startHour}
            onChange={(e) => setStart(e.target.value)}
            min={0}
            max={23}
            step={1}
          />
        </label>

        <label>
          Đến giờ
          <input
            type="number"
            value={endHour}
            onChange={(e) => setEnd(e.target.value)}
            min={1}
            max={24}
            step={1}
          />
        </label>

        {/* Tóm tắt đặt chỗ */}
        <div className="summary">
          <div>
            Thời lượng: <strong>{duration}</strong> giờ
          </div>
          <div>
            Tổng tiền:{' '}
            <strong>{total.toLocaleString('vi-VN')} đ</strong>
          </div>
        </div>

        {err && <div className="form-error">{err}</div>}

        <button onClick={book} disabled={invalid || loading}>
          {loading ? 'Đang đặt...' : 'Đặt ngay'}
        </button>
      </div>
    </div>
  );
}
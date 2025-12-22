import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../services/api';
import './Checkout.css';

export default function Checkout() {
  const { bookingId } = useParams();
  const nav = useNavigate();
  const [png, setPng] = useState('');
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');

  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('payment-info');
      if (!raw) { setErr('Không tìm thấy thông tin thanh toán'); return; }
      const data = JSON.parse(raw);
      if (data.booking.id !== bookingId) { setErr('Sai mã đơn thanh toán'); return; }

      setInfo(data);

      const payload = {
        bank: data.payment?.bank,
        account: data.payment?.accountNo,
        name: data.payment?.accountName,
        amount: data.booking.amount,
        memo: `DatSan_${data.booking.id}`,
      };
      QRCode.toDataURL(JSON.stringify(payload)).then(setPng);
    } catch {
      setErr('Không đọc được thông tin thanh toán');
    }
  }, [bookingId]);

  // NEW: gửi minh chứng -> booking chuyển Pending
  const submitProof = async () => {
    if (!file) {
      alert('Bạn cần upload minh chứng thanh toán (ảnh/PDF).');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('bookingId', bookingId);
      fd.append('paymentProof', file);

      await api('/bookings/submit-proof', {
        method: 'POST',
        body: fd,
      });

      alert('Đã gửi minh chứng. Booking đang ở trạng thái Pending chờ chủ sân duyệt.');
      nav('/my-bookings');
    } catch (e) {
      alert(e.message || 'Lỗi gửi minh chứng');
    } finally {
      setSubmitting(false);
    }
  };

  // Nút cũ vẫn giữ để bạn có thể demo nhanh nếu cần
  const confirmDemo = async () => {
    await api('/bookings/confirm-paid', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    });
    alert('Thanh toán thành công (demo)!');
    nav('/my-bookings');
  };

  if (err) return <div className="checkout-container">{err}</div>;
  if (!info) return <div className="checkout-container">Đang tải…</div>;

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <h2 className="checkout-title">Quét mã để thanh toán</h2>

        <img alt="QR thanh toán" src={png} className="qr-img" />

        <p className="payment-info">
          <b>Ngân hàng:</b> {info.payment?.bank} – <b>STK:</b> {info.payment?.accountNo} – <b>Tên:</b> {info.payment?.accountName}
        </p>
        <p className="payment-info payment-amount">
          <b>Số tiền:</b> {Number(info.booking.amount || 0).toLocaleString('vi-VN')} đ
        </p>

        {/* Upload minh chứng */}
        <div style={{ marginTop: 10, textAlign: 'left' }}>
          <label style={{ fontWeight: 600 }}>Minh chứng thanh toán (ảnh/PDF):</label>

          <div className="file-upload-row">
            <input
              id="paymentProof"
              className="file-input-hidden"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {/* DÙNG CHUNG CSS với nút gửi */}
            <label className="confirm-btn file-btn-like-confirm" htmlFor="paymentProof">
              Chọn file
            </label>

            <span className="file-name">
              {file?.name || 'Chưa chọn file'}
            </span>
          </div>

          <small style={{ display: 'block', marginTop: 10, opacity: 0.8 }}>
            Sau khi gửi minh chứng, booking sẽ ở trạng thái <b>Pending</b> chờ chủ sân duyệt.
          </small>
        </div>



        <button
          className="confirm-btn"
          onClick={submitProof}
          disabled={submitting}
          style={{ marginTop: 12 }}
        >
          {submitting ? 'Đang gửi…' : 'Gửi minh chứng'}
        </button>
      </div>
    </div>
  );
}

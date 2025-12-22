import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../services/api';
import './Checkout.css';

export default function Checkout() {
  const { bookingId: draftId } = useParams(); // giờ param này là draftId
  const nav = useNavigate();
  const [png, setPng] = useState('');
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');

  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`payment-info:${draftId}`);
      if (!raw) { setErr('Không tìm thấy thông tin thanh toán'); return; }
      const data = JSON.parse(raw);

      setInfo(data);

      const payload = {
        bank: data.payment?.bank,
        account: data.payment?.accountNo,
        name: data.payment?.accountName,
        amount: data.draft?.amount,
        memo: `DatSan_${draftId}`,
      };
      QRCode.toDataURL(JSON.stringify(payload)).then(setPng);
    } catch {
      setErr('Không đọc được thông tin thanh toán');
    }
  }, [draftId]);

  const submitProof = async () => {
    if (!file) {
      alert('Bạn cần upload minh chứng thanh toán (ảnh/PDF).');
      return;
    }
    if (!info?.draft) {
      alert('Thiếu thông tin đặt sân.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('courtId', info.draft.courtId);
      fd.append('date', info.draft.date);
      fd.append('startHour', String(info.draft.startHour));
      fd.append('endHour', String(info.draft.endHour));
      fd.append('paymentProof', file);

      await api('/bookings/submit-proof', {
        method: 'POST',
        body: fd,
      });

      // xoá draft để user back không thấy rác
      sessionStorage.removeItem(`payment-info:${draftId}`);

      alert('Đã gửi minh chứng. Booking đang ở trạng thái Pending chờ chủ sân duyệt.');
      nav('/my-bookings');
    } catch (e) {
      alert(e.message || 'Lỗi gửi minh chứng');
    } finally {
      setSubmitting(false);
    }
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
          <b>Số tiền:</b> {Number(info.draft?.amount || 0).toLocaleString('vi-VN')} đ
        </p>

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

            <label className="confirm-btn file-btn-like-confirm" htmlFor="paymentProof">
              Chọn file
            </label>

            <span className="file-name">{file?.name || 'Chưa chọn file'}</span>
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

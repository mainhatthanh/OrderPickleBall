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

  const confirm = async () => {
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

        <img
          alt="QR thanh toán"
          src={png}
          className="qr-img"
        />

        <p className="payment-info">
          <b>Ngân hàng:</b> {info.payment?.bank} – <b>STK:</b> {info.payment?.accountNo} – <b>Tên:</b> {info.payment?.accountName}
        </p>
        <p className="payment-info payment-amount">
          <b>Số tiền:</b> {Number(info.booking.amount || 0).toLocaleString('vi-VN')} đ
        </p>

        <button className="confirm-btn" onClick={confirm}>
          Tôi đã chuyển tiền
        </button>
      </div>
    </div>
  );
}
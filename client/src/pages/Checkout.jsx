import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../services/api';

export default function Checkout() {
    const { bookingId } = useParams();
    const nav = useNavigate();
    const [png, setPng] = useState('');
    const [info, setInfo] = useState(null);

    useEffect(() => {
        const raw = sessionStorage.getItem('payment-info');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.booking.id !== bookingId) return;
        setInfo(data);
        const payload = {
            bank: data.payment?.bank,
            account: data.payment?.accountNo,
            name: data.payment?.accountName,
            amount: data.booking.amount,
            memo: `DatSan_${data.booking.id}`
        };
        QRCode.toDataURL(JSON.stringify(payload)).then(setPng);
    }, [bookingId]);

    const confirm = async () => {
        await api('/bookings/confirm-paid', { method: 'POST', body: JSON.stringify({ bookingId }) });
        alert('Thanh toán thành công (demo)!');
        nav('/my-bookings');
    };

    if (!info) return <div style={{ padding: 16 }}>Không tìm thấy thông tin thanh toán</div>;
    return (
        <div style={{ padding: 16, textAlign: 'center' }}>
            <h2>Quét mã để thanh toán</h2>
            <img alt="qr" src={png} style={{ width: 260, height: 260 }} />
            <p><b>Ngân hàng:</b> {info.payment?.bank} – <b>STK:</b> {info.payment?.accountNo} – <b>Tên:</b> {info.payment?.accountName}</p>
            <p><b>Số tiền:</b> {info.booking.amount?.toLocaleString()} đ</p>
            <button onClick={confirm}>Tôi đã chuyển tiền</button>
        </div>
    );
}

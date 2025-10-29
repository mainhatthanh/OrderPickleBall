import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function CourtDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [court, setCourt] = useState(null);
    const [date, setDate] = useState('');
    const [startHour, setStart] = useState(18);
    const [endHour, setEnd] = useState(20);
    const [err, setErr] = useState('');

    useEffect(() => {
        api(`/courts/${id}`).then(setCourt).catch(e => setErr(e.message));
    }, [id]);

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const book = async () => {
        try {
            const { booking, payment } = await api('/bookings', {
                method: 'POST',
                body: JSON.stringify({
                    courtId: id,
                    date,
                    startHour: Number(startHour),
                    endHour: Number(endHour)
                })
            });
            sessionStorage.setItem('payment-info', JSON.stringify({ booking, payment }));
            nav(`/checkout/${booking.id}`);
        } catch (e) { setErr(e.message); }
    };

    const invalid =
        !date ||
        Number.isNaN(Number(startHour)) ||
        Number.isNaN(Number(endHour)) ||
        Number(startHour) >= Number(endHour);

    if (!court) return <div style={{ padding: 16 }}>{err || 'Đang tải...'}</div>;
    return (
        <div style={{ padding: 16, maxWidth: 560, margin: '0 auto' }}>
            <h2>{court.name}</h2>
            <div>{court.address}</div>
            <div>Giá: {court.pricePerHour?.toLocaleString()} đ/giờ</div>
            <hr />
            <h3>Đặt sân</h3>

            <div style={{ display: 'grid', gap: 8, maxWidth: 300 }}>
                <label>
                    Ngày:
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        required
                        min={today}
                    />
                </label>

                <label>
                    Từ giờ:
                    <input
                        type="number"
                        value={startHour}
                        onChange={e => setStart(e.target.value)}
                        min={0}
                        max={23}
                    />
                </label>

                <label>
                    Đến giờ:
                    <input
                        type="number"
                        value={endHour}
                        onChange={e => setEnd(e.target.value)}
                        min={1}
                        max={24}
                    />
                </label>

                {err && <div style={{ color: 'red' }}>{err}</div>}

                <button onClick={book} disabled={invalid}>
                    Đặt ngay
                </button>
            </div>
        </div>
    );
}

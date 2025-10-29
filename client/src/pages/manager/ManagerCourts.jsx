import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function ManagerCourts() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({ name: '', address: '', pricePerHour: 100000 });
    const load = () => api('/manager/courts').then(setItems);
    useEffect(() => { load().catch(console.error); }, []);
    const save = async () => {
        await api('/manager/courts/upsert', { method: 'POST', body: JSON.stringify(form) });
        setForm({ name: '', address: '', pricePerHour: 100000 });
        await load();
        alert('Đã gửi duyệt');
    };
    return (
        <div style={{ padding: 16 }}>
            <h2>Sân của tôi</h2>
            <div style={{ display: 'grid', gap: 6, maxWidth: 420 }}>
                <input placeholder="Tên sân" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <input placeholder="Địa chỉ" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                <input type="number" placeholder="Giá/giờ" value={form.pricePerHour} onChange={e => setForm({ ...form, pricePerHour: Number(e.target.value) })} />
                <button onClick={save}>Gửi duyệt</button>
            </div>
            <hr />
            {items.map(c => (
                <div key={c.id} style={{ border: '1px solid #ddd', padding: 10, marginBottom: 8 }}>
                    <b>{c.name}</b> – {c.address} – {c.pricePerHour?.toLocaleString()} đ/giờ – <i>{c.status}</i>
                </div>
            ))}
        </div>
    );
}

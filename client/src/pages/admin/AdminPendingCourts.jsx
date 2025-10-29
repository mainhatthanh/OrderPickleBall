import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function AdminPendingCourts() {
    const [items, setItems] = useState([]);
    const load = () => api('/admin/courts/pending').then(setItems);
    useEffect(() => { load().catch(console.error); }, []);
    const act = async (id, type) => {
        await api(`/admin/courts/${id}/${type}`, { method: 'POST' });
        await load();
    };
    return (
        <div style={{ padding: 16 }}>
            <h2>Sân chờ duyệt</h2>
            {items.map(c => (
                <div key={c.id} style={{ border: '1px solid #ddd', padding: 10, marginBottom: 8 }}>
                    <b>{c.name}</b> – {c.address} – {c.pricePerHour?.toLocaleString()} đ/giờ
                    <div>
                        <button onClick={() => act(c.id, 'approve')}>Duyệt</button>
                        <button onClick={() => act(c.id, 'reject')}>Từ chối</button>
                    </div>
                </div>
            ))}
        </div>
    );
}

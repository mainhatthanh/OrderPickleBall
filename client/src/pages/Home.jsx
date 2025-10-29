import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

export default function Home() {
    const [courts, setCourts] = useState([]);
    useEffect(() => { api('/courts').then(setCourts).catch(console.error); }, []);
    return (
        <div style={{ padding: 16 }}>
            <h2>Danh sách sân</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                {courts.map(c => (
                    <div key={c.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
                        <h4>{c.name}</h4>
                        <div>{c.address}</div>
                        <div>Giá: {c.pricePerHour?.toLocaleString()} đ/giờ</div>
                        <Link to={`/court/${c.id}`}>Xem chi tiết</Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

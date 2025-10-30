import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
    const [courts, setCourts] = useState([]);

    useEffect(() => {
        api('/courts').then(setCourts).catch(console.error);
    }, []);

    return (
        <div className="home-container">
            <h2 className="home-title">Danh sách sân</h2>
            <div className="court-grid">
                {courts.map(c => (
                    <div key={c.id} className="court-card">
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

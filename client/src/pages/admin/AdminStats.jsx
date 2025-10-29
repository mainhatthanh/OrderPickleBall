import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function AdminStats() {
    const [data, setData] = useState(null);
    useEffect(() => { api('/stats/summary').then(setData).catch(console.error); }, []);
    if (!data) return <div style={{ padding: 16 }}>Đang tải...</div>;
    return (
        <div style={{ padding: 16 }}>
            <h2>Thống kê hệ thống</h2>
            <div>Tổng số sân: {data.totalCourts}</div>
            <div>Tổng lượt đặt: {data.totalBookings}</div>
            <div>Doanh thu ước tính: {data.revenue?.toLocaleString()} đ</div>
            <h3>Theo tháng</h3>
            <ul>
                {Object.entries(data.byMonth).map(([k, v]) => <li key={k}>{k}: {v.toLocaleString()} đ</li>)}
            </ul>
        </div>
    );
}

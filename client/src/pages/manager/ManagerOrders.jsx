import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function ManagerOrders() {
    const [items, setItems] = useState([]);
    useEffect(() => { api('/manager/orders').then(setItems).catch(console.error); }, []);

    return (
        <div style={{ padding: 16 }}>
            <h2>Đơn đặt sân</h2>
            <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên sân</th> {/* thêm cột */}
                        <th>Ngày</th>
                        <th>Giờ</th>
                        <th>Tiền</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(x => (
                        <tr key={x.id}>
                            <td>{x.id}</td>
                            <td>{x.courtName}</td> {/* dùng courtName */}
                            <td>{x.date}</td>
                            <td>{x.startHour}-{x.endHour}</td>
                            <td>{x.amount?.toLocaleString()} đ</td>
                            <td>{x.status}</td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr><td colSpan="6" align="center">Chưa có đơn đặt sân nào</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

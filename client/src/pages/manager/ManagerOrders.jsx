import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './ManagerOrders.css';

export default function ManagerOrders() {
  const [items, setItems] = useState([]);
  useEffect(() => { api('/manager/orders').then(setItems).catch(console.error); }, []);

  return (
    <div className="manager-orders">
      <h2>Đơn đặt sân</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên sân</th>
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
              <td>{x.courtName}</td>
              <td>{x.date}</td>
              <td>{x.startHour}-{x.endHour}</td>
              <td>{x.amount?.toLocaleString()} đ</td>
              <td>{x.status}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan="6">Chưa có đơn đặt sân nào</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
import { Link } from 'react-router-dom';
import { me, logout } from '../services/auth';

export default function NavBar() {
    const user = me();
    return (
        <nav style={{ display: 'flex', gap: 12, padding: 12, background: '#eef' }}>
            <Link to="/">Trang chủ</Link>
            {user?.role === 'user' && <Link to="/my-bookings">Lịch của tôi</Link>}
            {user?.role === 'admin' && <Link to="/admin/pending-courts">Duyệt sân</Link>}
            {user?.role === 'admin' && <Link to="/admin/stats">Thống kê</Link>}
            {user?.role === 'admin' && <Link to="/admin/users">Người dùng</Link>}
            {user?.role === 'manager' && <>
                <Link to="/manager/courts">Sân của tôi</Link>
                <Link to="/manager/orders">Đơn đặt</Link>
                <Link to="/manager/payment">Thanh toán</Link>
            </>}
            <span style={{ flex: 1 }} />
            {user ? (
                <>
                    <span>Xin chào, {user.name}</span>
                    <button onClick={() => { logout(); location.href = '/login'; }}>Đăng xuất</button>
                </>
            ) : <Link to="/login">Đăng nhập</Link>}
        </nav>
    );
}

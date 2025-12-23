import { Link } from 'react-router-dom';
import { me, logout } from '../services/auth';
import './NavBar.css';

export default function NavBar() {
    const user = me();

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <Link to="/">🏠 Trang chủ</Link>

                {user?.role === 'user' && <Link to="/my-bookings">📆Lịch của tôi</Link>}
                {user?.role === 'admin' && (
                    <>
                        <Link to="/admin/pending-courts">🥎Duyệt sân</Link>
                        <Link to="/admin/stats">💸Thống kê</Link>
                        <Link to="/admin/users">👑Người dùng</Link>
                    </>
                )}
                {user?.role === 'manager' && (
                    <>
                        <Link to="/manager/courts">🥎Sân của tôi</Link>
                        <Link to="/manager/orders">📋Đơn đặt</Link>
                        <Link to="/manager/payment">💳Thanh toán</Link>
                    </>
                )}
            </div>

            <div className="navbar-right">
                {user ? (
                    <>
                        <span>Xin chào, <strong>{user.name}</strong></span>
                        <button onClick={() => { logout(); location.href = '/login'; }}>Đăng xuất</button>
                    </>
                ) : (
                    <Link to="/login">Đăng nhập</Link>
                )}
            </div>
        </nav>
    );
}

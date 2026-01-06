import { Link, useLocation } from 'react-router-dom';
import { me, logout } from '../services/auth';
import './NavBar.css';

export default function NavBar() {
    const user = me();
    const location = useLocation();

    // Check if current path matches (for active state - Consistency)
    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    // Logout with confirmation (Minimal Surprise + Recoverability)
    const handleLogout = () => {
        if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
            logout();
            window.location.href = '/login';
        }
    };

    return (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
            <div className="navbar-left">
                <Link to="/" className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`} title="Về trang chủ - Tìm và đặt sân">
                    🏠 Trang chủ
                </Link>

                {user?.role === 'user' && (
                    <Link to="/my-bookings" className={`nav-link ${isActive('/my-bookings') ? 'active' : ''}`} title="Xem lịch sử đặt sân của bạn">
                        📋 Lịch đặt của tôi
                    </Link>
                )}

                {user?.role === 'admin' && (
                    <>
                        <Link to="/admin/pending-courts" className={`nav-link ${isActive('/admin/pending-courts') ? 'active' : ''}`} title="Duyệt các sân chờ phê duyệt">
                            ✅ Duyệt sân
                        </Link>
                        <Link to="/admin/stats" className={`nav-link ${isActive('/admin/stats') ? 'active' : ''}`} title="Xem thống kê hệ thống">
                            📊 Thống kê
                        </Link>
                        <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`} title="Quản lý tài khoản người dùng">
                            👥 Người dùng
                        </Link>
                    </>
                )}

                {user?.role === 'manager' && (
                    <>
                        <Link to="/manager/courts" className={`nav-link ${isActive('/manager/courts') ? 'active' : ''}`} title="Quản lý sân của bạn">
                            🏟️ Sân của tôi
                        </Link>
                        <Link to="/manager/register-court" className={`nav-link ${isActive('/manager/register-court') ? 'active' : ''}`} title="Đăng ký sân mới">
                            ➕ Đăng ký sân
                        </Link>
                        <Link to="/manager/orders" className={`nav-link ${isActive('/manager/orders') ? 'active' : ''}`} title="Xem và duyệt đơn đặt sân">
                            📝 Đơn đặt sân
                        </Link>
                        <Link to="/manager/revenue" className={`nav-link ${isActive('/manager/revenue') ? 'active' : ''}`} title="Xem doanh thu theo sân">
                            💰 Doanh thu
                        </Link>
                        <Link to="/manager/payment" className={`nav-link ${isActive('/manager/payment') ? 'active' : ''}`} title="Cài đặt thông tin nhận thanh toán">
                            💳 Thanh toán
                        </Link>
                    </>
                )}
            </div>

            <div className="navbar-right">
                {user ? (
                    <>
                        <span className="user-greeting">
                            <span className="user-role-badge">{user.role === 'admin' ? '👑' : user.role === 'manager' ? '🏢' : '👤'}</span>
                            <strong>{user.name}</strong>
                        </span>
                        <button className="logout-btn" onClick={handleLogout} title="Đăng xuất khỏi tài khoản">
                            Đăng xuất
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="login-link" title="Đăng nhập để đặt sân">
                        🔑 Đăng nhập
                    </Link>
                )}
            </div>
        </nav>
    );
}

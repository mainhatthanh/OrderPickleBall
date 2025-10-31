import { useState } from 'react';
import { api } from '../services/api';
import { saveSession } from '../services/auth';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // dùng chung CSS với Login

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState(''); // ✅ thêm trường xác nhận
    const [role, setRole] = useState('user');
    const [err, setErr] = useState('');
    const nav = useNavigate();

    async function submit(e) {
        e.preventDefault();
        setErr('');

        // ✅ kiểm tra hai mật khẩu trùng nhau
        if (password !== confirm) {
            setErr('Mật khẩu xác nhận không khớp');
            return;
        }

        try {
            const { token, user } = await api('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password, role }),
            });
            saveSession(token, user);
            nav('/login');
        } catch (ex) {
            setErr(typeof ex.message === 'string' ? ex.message : 'Đăng ký thất bại');
        }
    }

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={submit}>
                <h2 className="login-title">Đăng ký tài khoản</h2>

                <div className="input-group">
                    <label>Họ và tên</label>
                    <input
                        placeholder="Họ và tên"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Mật khẩu</label>
                    <input
                        type="password"
                        placeholder="••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {/* ✅ thêm dòng xác nhận mật khẩu */}
                <div className="input-group">
                    <label>Xác nhận mật khẩu</label>
                    <input
                        type="password"
                        placeholder="Nhập lại mật khẩu"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Vai trò</label>
                    <select
                        className="input-like"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                    </select>
                </div>

                {err && <div className="form-error">{err}</div>}

                <button className="btn-primary" type="submit">
                    Đăng ký
                </button>

                <p className="demo-note" style={{ marginTop: 12 }}>
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </p>
            </form>
        </div>
    );
}

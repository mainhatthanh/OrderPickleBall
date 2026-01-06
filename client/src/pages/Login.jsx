import { useState } from 'react';
import { login } from '../services/auth';
import { Link } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const disabled = !email || !password || loading;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (e) {
      // User Guidance: Specific error messages
      const msg = e?.message || '';
      if (msg.includes('password') || msg.includes('mật khẩu')) {
        setErr('Mật khẩu không đúng. Vui lòng kiểm tra lại.');
      } else if (msg.includes('email') || msg.includes('user') || msg.includes('không tìm')) {
        setErr('Email không tồn tại trong hệ thống.');
      } else {
        setErr(msg || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-header">
          <span className="login-icon">🎾</span>
          <h2 className="login-title">Đăng nhập</h2>
          <p className="login-subtitle">Chào mừng bạn đến với PicklePlay</p>
        </div>

        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            aria-describedby="email-hint"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Mật khẩu</label>
          <div className="pwd-wrap">
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="toggle-pwd"
              onClick={() => setShowPwd((s) => !s)}
              aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              title={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPwd ? '🙈 Ẩn' : '👁️ Hiện'}
            </button>
          </div>
        </div>

        {/* Error with recovery hint (User Guidance + Recoverability) */}
        {err && (
          <div className="form-error" role="alert">
            <span className="error-icon">⚠️</span>
            {err}
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={disabled}>
          {loading ? '⏳ Đang xử lý...' : '🔑 Đăng nhập'}
        </button>

        {/* Demo accounts info (User Guidance) */}
        <details className="demo-accounts">
          <summary>💡 Tài khoản dùng thử</summary>
          <div className="account-list">
            <div className="account-item" onClick={() => { setEmail('user@pickleplay.dev'); setPassword('123456'); }}>
              <span>👤 Người dùng:</span>
              <code>user@pickleplay.dev</code>
            </div>
            <div className="account-item" onClick={() => { setEmail('manager@pickleplay.dev'); setPassword('123456'); }}>
              <span>🏢 Chủ sân:</span>
              <code>manager@pickleplay.dev</code>
            </div>
            <div className="account-item" onClick={() => { setEmail('admin@pickleplay.dev'); setPassword('123456'); }}>
              <span>👑 Admin:</span>
              <code>admin@pickleplay.dev</code>
            </div>
            <p className="pwd-hint">Mật khẩu mặc định: <strong>123456</strong></p>
          </div>
        </details>

        <div className="login-footer">
          <p>
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </form>
    </div>
  );
}

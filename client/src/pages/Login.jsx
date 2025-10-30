import { useState } from 'react';
import { login } from '../services/auth';
import './Login.css'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const disabled = !email || !password;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await login(email, password);
      location.href = '/';
    } catch (e) {
      setErr(e?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <h2 className="login-title">Đăng nhập</h2>

        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="user@pickleplay.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="input-group">
          <label>Mật khẩu</label>
          <div className="pwd-wrap">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••"
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
            >
              {showPwd ? 'Ẩn' : 'Hiện'}
            </button>
          </div>
        </div>

        {err && <div className="form-error">{err}</div>}

        <button className="btn-primary" type="submit" disabled={disabled}>
          Đăng nhập
        </button>

        <p className="demo-note">
          <strong>Tài khoản mẫu:</strong> admin / manager / user @pickleplay.dev<br />
          <span>(mật khẩu: 123456)</span>
        </p>
      </form>
    </div>
  );
}
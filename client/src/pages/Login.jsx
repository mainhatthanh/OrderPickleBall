import { useState } from 'react';
import { login } from '../services/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const onSubmit = async (e) => {
        e.preventDefault();
        try { await login(email, password); location.href = '/'; }
        catch (e) { setErr(e.message); }
    };
    return (
        <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: '40px auto', display: 'grid', gap: 8 }}>
            <h2>Đăng nhập</h2>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} />
            {err && <div style={{ color: 'red' }}>{err}</div>}
            <button>Đăng nhập</button>
            <p>Tài khoản mẫu: admin/manager/user @pickleplay.dev (mật khẩu: 123456)</p>
        </form>
    );
}

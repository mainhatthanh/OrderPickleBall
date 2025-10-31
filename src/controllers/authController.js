// src/controllers/authController.js
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken } from '../middleware/auth.js';

export async function login(req, res) {
    const { email, password } = req.body || {};
    const user = db.data.users.find(u => u.email === email);
    if (!user) return res.status(400).json({ message: 'Sai email hoặc mật khẩu' });

    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Sai email hoặc mật khẩu' });
    if (user.locked) return res.status(403).json({ message: 'Tài khoản bị khóa' });

    res.json({ token: signToken(user), user: { id: user.id, name: user.name, role: user.role } });
}


export function register(req, res) {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Thiếu thông tin đăng ký' });
    if (role && !['user', 'manager'].includes(role)) return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    const existed = db.data.users.find(u => u.email === email);
    if (existed) return res.status(400).json({ message: 'Email đã được sử dụng' });

    const id = 'u_' + Math.random().toString(36).slice(2, 8);
    const hashed = bcrypt.hashSync(password, 8);

    const newUser = { id, name, email, password: hashed, role: role || 'user', locked: false };
    db.data.users.push(newUser);
    db.write();

    const token = signToken(newUser); // ✅ dùng helper sẵn có
    res.json({ message: 'Đăng ký thành công', token, user: { id, name, role: newUser.role } });
}
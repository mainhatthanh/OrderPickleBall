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

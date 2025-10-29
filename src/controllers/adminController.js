// src/controllers/adminController.js
import { db } from '../db.js';

// 1) Danh sách sân đang chờ duyệt
export function listPendingCourts(_req, res) {
    res.json(db.data.courts.filter(c => c.status === 'pending'));
}

// 2) Duyệt sân => active
export function approveCourt(req, res) {
    const c = db.data.courts.find(x => x.id === req.params.id);
    if (!c) return res.status(404).json({ message: 'Không tìm thấy sân' });
    c.status = 'active';
    db.write();
    res.json({ message: 'Đã duyệt, sân hoạt động' });
}

// 3) Từ chối sân => rejected
export function rejectCourt(req, res) {
    const c = db.data.courts.find(x => x.id === req.params.id);
    if (!c) return res.status(404).json({ message: 'Không tìm thấy sân' });
    c.status = 'rejected';
    db.write();
    res.json({ message: 'Đã từ chối sân' });
}

// 4) Xem danh sách người dùng
export function listUsers(_req, res) {
    res.json(db.data.users);
}

// 5) Khóa/Mở khóa tài khoản
export function lockToggle(req, res) {
    const u = db.data.users.find(x => x.id === req.params.id);
    if (!u) return res.status(404).json({ message: 'Không tìm thấy user' });

    // ❗ chặn khóa chính mình
    if (u.id === req.user.id) {
        return res.status(400).json({ message: 'Không thể tự khóa tài khoản của chính bạn' });
    }
    // ❗ chặn khóa tài khoản admin
    if (u.role === 'admin') {
        return res.status(403).json({ message: 'Không thể khóa tài khoản có vai trò Admin' });
    }

    u.locked = !u.locked;
    db.write();
    res.json({ message: u.locked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' });
}


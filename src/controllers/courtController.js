import { db } from '../db.js';

export function listPublic(_req, res) {
    const items = db.data.courts.filter(c => c.status === 'active');
    res.json(items);
}

export function detail(req, res) {
    const item = db.data.courts.find(c => c.id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy sân' });
    if (item.status !== 'active') return res.status(403).json({ message: 'Sân chưa công khai' });
    res.json(item);
}
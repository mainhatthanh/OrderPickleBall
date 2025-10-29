// src/controllers/statsController.js
import { db } from '../db.js';

export function summary(_req, res) {
    const totalCourts = db.data.courts.filter(c => c.status === 'active').length;
    const totalBookings = db.data.bookings.length;
    const revenue = db.data.transactions.reduce(
        (s, t) => s + (t.status === 'paid' ? t.amount : 0),
        0
    );
    // gộp theo tháng (YYYY-MM)
    const byMonth = {};
    for (const t of db.data.transactions) {
        if (t.status !== 'paid') continue;
        const k = (t.createdAt || new Date().toISOString()).slice(0, 7);
        byMonth[k] = (byMonth[k] || 0) + t.amount;
    }
    res.json({ totalCourts, totalBookings, revenue, byMonth });
}

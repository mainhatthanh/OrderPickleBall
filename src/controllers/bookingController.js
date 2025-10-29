import { db } from '../db.js';
import { nanoid } from 'nanoid';

// helper: kiểm tra định dạng YYYY-MM-DD hợp lệ (không chấp nhận rỗng/format sai)
function isValidDateYYYYMMDD(s) {
    if (typeof s !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s + 'T00:00:00Z');
    // so khớp lại để chắc chắn không lệch (ví dụ 2025-02-30)
    return !Number.isNaN(d.getTime()) && s === d.toISOString().slice(0, 10);
}

// Lấy danh sách booking của chính user
export function listMy(req, res) {
    const items = db.data.bookings.filter(b => b.userId === req.user.id);
    res.json(items);
}

// Tạo booking: pending_payment + trả về info để sinh QR
export function create(req, res) {
    let { courtId, date, startHour, endHour } = req.body || {};

    // chuẩn hóa
    date = typeof date === 'string' ? date.trim() : '';
    startHour = Number(startHour);
    endHour = Number(endHour);

    // 1) Validate input bắt buộc
    if (!courtId) return res.status(400).json({ message: 'Thiếu courtId' });
    if (!date) return res.status(400).json({ message: 'Thiếu ngày (YYYY-MM-DD)' });
    if (!isValidDateYYYYMMDD(date)) {
        return res.status(400).json({ message: 'Ngày không hợp lệ (định dạng YYYY-MM-DD)' });
    }
    if (!Number.isInteger(startHour) || !Number.isInteger(endHour)) {
        return res.status(400).json({ message: 'Giờ phải là số nguyên' });
    }
    if (startHour < 0 || endHour > 24 || startHour >= endHour) {
        return res.status(400).json({ message: 'Khoảng giờ không hợp lệ (0–24, start < end)' });
    }

    // (tuỳ chọn) không cho đặt ngày quá khứ
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) return res.status(400).json({ message: 'Không thể đặt ngày trong quá khứ' });

    // 2) Kiểm tra sân
    const court = db.data.courts.find(c => c.id === courtId && c.status === 'active');
    if (!court) return res.status(400).json({ message: 'Sân không khả dụng' });

    // 3) Check trùng giờ cùng ngày
    const overlap = db.data.bookings.find(
        b => b.courtId === courtId &&
            b.date === date &&
            !(endHour <= b.startHour || startHour >= b.endHour) &&
            ['pending_payment', 'confirmed'].includes(b.status)
    );
    if (overlap) return res.status(409).json({ message: 'Khung giờ đã được đặt' });

    // 4) Tính tiền & lưu
    const hours = endHour - startHour; // > 0 chắc chắn
    const amount = hours * Number(court.pricePerHour || 0);
    const booking = {
        id: nanoid(8),
        userId: req.user.id,
        courtId,
        date,
        startHour,
        endHour,
        amount,
        status: 'pending_payment',
        createdAt: new Date().toISOString()
    };
    db.data.bookings.push(booking);

    // Thông tin tài khoản chủ sân để client sinh QR
    const ownerProfile = db.data.paymentProfiles.find(p => p.ownerId === court.ownerId) || null;

    db.write();
    res.json({ booking, payment: ownerProfile });
}

// Demo: xác nhận đã thanh toán -> chuyển confirmed
export function confirmPaid(req, res) {
    const { bookingId } = req.body || {};
    const b = db.data.bookings.find(x => x.id === bookingId);
    if (!b) return res.status(404).json({ message: 'Không tìm thấy booking' });

    b.status = 'confirmed';
    db.data.transactions.push({
        id: nanoid(8),
        bookingId,
        amount: b.amount,
        status: 'paid',
        createdAt: new Date().toISOString()
    });

    db.write();
    res.json({ message: 'Thanh toán thành công (demo)', booking: b });
}
import { db } from '../db.js';
import { nanoid } from 'nanoid';

// helper: kiểm tra định dạng YYYY-MM-DD hợp lệ
function isValidDateYYYYMMDD(s) {
    if (typeof s !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s + 'T00:00:00Z');
    return !Number.isNaN(d.getTime()) && s === d.toISOString().slice(0, 10);
}

// Lấy danh sách booking của chính user
export function listMy(req, res) {
    const courts = db.data.courts || [];
    const courtById = new Map(courts.map(c => [c.id, c]));

    const items = (db.data.bookings || [])
        .filter(b => b.userId === req.user.id)
        .map(b => {
            const c = courtById.get(b.courtId) || {};
            return {
                ...b,
                courtName: b.courtName || c.name || b.courtId,
                courtAddress: b.address || c.address || '(Không rõ địa chỉ)',
            };
        });

    res.json(items);
}

/**
 * PREPARE CHECKOUT (KHÔNG tạo booking)
 * POST /bookings
 * Body: { courtId, date, startHour, endHour }
 * Return: { draft, payment }
 */
export function create(req, res) {
    let { courtId, date, startHour, endHour } = req.body || {};

    // chuẩn hóa
    date = typeof date === 'string' ? date.trim() : '';
    startHour = Number(startHour);
    endHour = Number(endHour);

    // Validate
    if (!courtId) return res.status(400).json({ message: 'Thiếu courtId' });
    if (!date) return res.status(400).json({ message: 'Thiếu ngày (YYYY-MM-DD)' });
    if (!isValidDateYYYYMMDD(date)) return res.status(400).json({ message: 'Ngày không hợp lệ (YYYY-MM-DD)' });

    if (!Number.isInteger(startHour) || !Number.isInteger(endHour)) {
        return res.status(400).json({ message: 'Giờ phải là số nguyên' });
    }
    if (startHour < 0 || endHour > 24 || startHour >= endHour) {
        return res.status(400).json({ message: 'Khoảng giờ không hợp lệ (0–24, start < end)' });
    }

    // không cho đặt ngày quá khứ
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) return res.status(400).json({ message: 'Không thể đặt ngày trong quá khứ' });

    // Kiểm tra sân
    const court = db.data.courts.find(c => c.id === courtId && c.status === 'active');
    if (!court) return res.status(400).json({ message: 'Sân không khả dụng' });

    // Check trùng lịch: chỉ chặn các booking thật (pending/confirmed)
    const overlap = (db.data.bookings || []).find(
        b =>
            b.courtId === courtId &&
            b.date === date &&
            !(endHour <= b.startHour || startHour >= b.endHour) &&
            ['pending', 'confirmed'].includes(b.status)
    );
    if (overlap) return res.status(409).json({ message: 'Khung giờ đã được đặt' });

    // Tính tiền
    const hours = endHour - startHour;
    const amount = hours * Number(court.pricePerHour || 0);

    // Draft chỉ để hiển thị QR + gửi lên cùng minh chứng (không ghi DB)
    const draft = {
        courtId,
        date,
        startHour,
        endHour,
        amount,
        courtName: court.name,
        courtAddress: court.address,
    };

    // thông tin tài khoản chủ sân để client sinh QR
    const ownerProfile = db.data.paymentProfiles.find(p => p.ownerId === court.ownerId) || null;

    res.json({ draft, payment: ownerProfile });
}

/**
 * User upload minh chứng -> TẠO booking thật với status 'pending'
 * POST /bookings/submit-proof (multipart/form-data)
 * Fields: courtId, date, startHour, endHour, + file "paymentProof"
 */
export function submitProof(req, res) {
    let { courtId, date, startHour, endHour } = req.body || {};

    date = typeof date === 'string' ? date.trim() : '';
    startHour = Number(startHour);
    endHour = Number(endHour);

    if (!courtId) return res.status(400).json({ message: 'Thiếu courtId' });
    if (!date) return res.status(400).json({ message: 'Thiếu ngày (YYYY-MM-DD)' });
    if (!isValidDateYYYYMMDD(date)) return res.status(400).json({ message: 'Ngày không hợp lệ (YYYY-MM-DD)' });
    if (!Number.isInteger(startHour) || !Number.isInteger(endHour)) {
        return res.status(400).json({ message: 'Giờ phải là số nguyên' });
    }
    if (startHour < 0 || endHour > 24 || startHour >= endHour) {
        return res.status(400).json({ message: 'Khoảng giờ không hợp lệ (0–24, start < end)' });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (date < today) return res.status(400).json({ message: 'Không thể đặt ngày trong quá khứ' });

    // file bắt buộc
    if (!req.file) return res.status(400).json({ message: 'Chưa upload minh chứng thanh toán' });

    // kiểm tra sân
    const court = db.data.courts.find(c => c.id === courtId && c.status === 'active');
    if (!court) return res.status(400).json({ message: 'Sân không khả dụng' });

    // check trùng lịch (lần cuối, phòng trường hợp có người đặt trước trong lúc user đang ở checkout)
    const overlap = (db.data.bookings || []).find(
        b =>
            b.courtId === courtId &&
            b.date === date &&
            !(endHour <= b.startHour || startHour >= b.endHour) &&
            ['pending', 'confirmed'].includes(b.status)
    );
    if (overlap) return res.status(409).json({ message: 'Khung giờ đã được đặt (vui lòng chọn khung giờ khác)' });

    // tính lại amount theo giá hiện tại để tránh client sửa amount
    const hours = endHour - startHour;
    const amount = hours * Number(court.pricePerHour || 0);

    const bookingId = nanoid(8);
    const booking = {
        id: bookingId,
        userId: req.user.id,
        courtId,
        date,
        startHour,
        endHour,
        amount,
        status: 'pending',
        paymentProofUrl: `/uploads/payment_proofs/${req.file.filename}`,
        rejectReason: null,
        createdAt: new Date().toISOString(),
        proofSubmittedAt: new Date().toISOString(),
    };

    db.data.bookings.push(booking);

    db.data.transactions.push({
        id: nanoid(8),
        bookingId,
        amount,
        status: 'proof_submitted',
        createdAt: new Date().toISOString(),
    });

    db.write();
    res.json({ message: 'Đã gửi minh chứng. Booking đang chờ chủ sân duyệt (Pending).', booking });
}

// giữ lại demo cũ nếu bạn muốn (nhưng giờ không còn dùng trong UI)
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
        createdAt: new Date().toISOString(),
    });

    db.write();
    res.json({ message: 'Thanh toán thành công (demo)', booking: b });
}

// src/controllers/managerController.js
import { db } from '../db.js';
import { nanoid } from 'nanoid';

// xem tất cả sân thuộc về manager hiện tại
export function myCourts(req, res) {
    const items = db.data.courts.filter(c => c.ownerId === req.user.id);
    res.json(items);
}

// tạo/sửa sân (đặt về trạng thái 'pending' để chờ admin duyệt)
export function upsertCourt(req, res) {
    const { id, name, address, pricePerHour, hourlyPrices, imageUrl, mapUrl } = req.body || {};
    if (!name || !address || !pricePerHour) {
        return res.status(400).json({ message: 'Thiếu name/address/pricePerHour' });
    }
    
    // Validate hourlyPrices nếu có
    let validatedHourlyPrices = {};
    if (hourlyPrices && typeof hourlyPrices === 'object') {
        for (const [hour, price] of Object.entries(hourlyPrices)) {
            const h = Number(hour);
            const p = Number(price);
            if (h >= 0 && h <= 23 && p > 0) {
                validatedHourlyPrices[h] = p;
            }
        }
    }
    
    if (id) {
        const c = db.data.courts.find(x => x.id === id && x.ownerId === req.user.id);
        if (!c) return res.status(404).json({ message: 'Không tìm thấy sân của bạn' });
        c.name = name;
        c.address = address;
        c.pricePerHour = Number(pricePerHour);
        c.hourlyPrices = validatedHourlyPrices;
        c.imageUrl = imageUrl || null;
        c.mapUrl = mapUrl || null;
        if (c.status === 'active') c.status = 'pending';
    } else {
        const newId = 'c_' + nanoid(8);
        db.data.courts.push({
            id: newId,
            name,
            address,
            pricePerHour: Number(pricePerHour),
            hourlyPrices: validatedHourlyPrices,
            imageUrl: imageUrl || null,
            mapUrl: mapUrl || null,
            status: 'pending',
            images: [],
            ownerId: req.user.id,
        });
    }
    db.write();
    res.json({ message: 'Đã lưu (chờ admin duyệt)' });
}

// xem tất cả đơn đặt sân thuộc các sân của manager
// hỗ trợ query ?status=pending để lọc đơn chờ duyệt
export function myOrders(req, res) {
    const { status } = req.query || {};

    // lấy các sân thuộc manager
    const myCourts = db.data.courts.filter(c => c.ownerId === req.user.id);
    const idToName = Object.fromEntries(myCourts.map(c => [c.id, c.name]));
    const myCourtIds = myCourts.map(c => c.id);

    // map userId -> userName để hiển thị
    const idToUser = Object.fromEntries((db.data.users || []).map(u => [u.id, u.name]));

    let items = db.data.bookings
        .filter(b => myCourtIds.includes(b.courtId))
        .map(b => ({
            ...b,
            courtName: idToName[b.courtId] || b.courtId,
            userName: idToUser[b.userId] || b.userId,
        }));

    if (status) items = items.filter(x => x.status === status);

    res.json(items);
}

// NEW: duyệt booking (Pending -> confirmed)
export function approveBooking(req, res) {
    const { bookingId } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'Thiếu bookingId' });

    const b = db.data.bookings.find(x => x.id === bookingId);
    if (!b) return res.status(404).json({ message: 'Không tìm thấy booking' });

    // booking phải thuộc sân của manager
    const court = db.data.courts.find(c => c.id === b.courtId);
    if (!court || court.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Bạn không có quyền duyệt booking này' });
    }

    if (b.status !== 'pending') {
        return res.status(400).json({ message: 'Booking không ở trạng thái Pending' });
    }

    b.status = 'confirmed';
    b.approvedAt = new Date().toISOString();
    b.rejectReason = null;

    db.data.transactions.push({
        id: 'tx_' + Date.now(),
        bookingId,
        amount: b.amount,
        status: 'approved',
        createdAt: new Date().toISOString(),
    });

    db.write();
    res.json({ message: 'Đã duyệt booking', booking: b });
}

// NEW: từ chối booking (Pending -> rejected)
export function rejectBooking(req, res) {
    const { bookingId, reason } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'Thiếu bookingId' });

    const b = db.data.bookings.find(x => x.id === bookingId);
    if (!b) return res.status(404).json({ message: 'Không tìm thấy booking' });

    const court = db.data.courts.find(c => c.id === b.courtId);
    if (!court || court.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Bạn không có quyền từ chối booking này' });
    }

    if (b.status !== 'pending') {
        return res.status(400).json({ message: 'Booking không ở trạng thái Pending' });
    }

    b.status = 'rejected';
    b.rejectedAt = new Date().toISOString();
    b.rejectReason = (reason || '').trim() || 'Minh chứng không hợp lệ';

    db.data.transactions.push({
        id: 'tx_' + Date.now(),
        bookingId,
        amount: b.amount,
        status: 'rejected',
        createdAt: new Date().toISOString(),
    });

    db.write();
    res.json({ message: 'Đã từ chối booking', booking: b });
}

// cập nhật thông tin tài khoản nhận tiền (để client sinh QR)
export function setPaymentProfile(req, res) {
    const { bank, accountNo, accountName, phone } = req.body || {};
    if (!bank || !accountNo || !accountName) {
        return res.status(400).json({ message: 'Thiếu bank/accountNo/accountName' });
    }
    let p = db.data.paymentProfiles.find(x => x.ownerId === req.user.id);
    if (!p) {
        p = { id: 'pp_' + req.user.id, ownerId: req.user.id, bank, accountNo, accountName, phone: phone || '' };
        db.data.paymentProfiles.push(p);
    } else {
        p.bank = bank;
        p.accountNo = accountNo;
        p.accountName = accountName;
        p.phone = phone || p.phone || '';
    }
    db.write();
    res.json({ message: 'Đã cập nhật', profile: p });
}

// Lấy thông tin thanh toán hiện tại
export function getPaymentProfile(req, res) {
    const p = db.data.paymentProfiles.find(x => x.ownerId === req.user.id);
    res.json(p || null);
}

// Upload ảnh sân
export function uploadCourtImageHandler(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: 'Chưa chọn file ảnh' });
    }
    
    // Trả về URL của ảnh đã upload
    const imageUrl = `/uploads/court_images/${req.file.filename}`;
    res.json({ 
        message: 'Upload thành công',
        imageUrl 
    });
}

// Xóa sân
export function deleteCourt(req, res) {
    const { id } = req.params;
    
    const courtIndex = db.data.courts.findIndex(c => c.id === id && c.ownerId === req.user.id);
    if (courtIndex === -1) {
        return res.status(404).json({ message: 'Không tìm thấy sân của bạn' });
    }
    
    // Lấy ngày hôm nay (YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);
    
    // Kiểm tra xem sân có booking trong tương lai (từ hôm nay trở đi) với status pending/confirmed không
    const hasFutureBookings = db.data.bookings.some(
        b => b.courtId === id && 
             b.date >= today && 
             ['pending', 'confirmed', 'pending_payment'].includes(b.status)
    );
    
    if (hasFutureBookings) {
        return res.status(400).json({ message: 'Không thể xóa sân đang có lịch đặt trong tương lai' });
    }
    
    // Xóa sân
    db.data.courts.splice(courtIndex, 1);
    db.write();
    
    res.json({ message: 'Đã xóa sân thành công' });
}

// Tính doanh thu (tất cả thời gian) cho các sân thuộc manager, chỉ tính booking confirmed
export function revenue(req, res) {
    const myCourts = db.data.courts.filter(c => c.ownerId === req.user.id);
    const idToName = Object.fromEntries(myCourts.map(c => [c.id, c.name]));
    const myCourtIds = new Set(myCourts.map(c => c.id));
    const activeCourts = myCourts.filter(c => c.status === 'active');

    const confirmed = (db.data.bookings || []).filter(
        b => myCourtIds.has(b.courtId) && b.status === 'confirmed'
    );

    // Gom theo sân
    const breakdownMap = new Map();
    for (const b of confirmed) {
        const current = breakdownMap.get(b.courtId) || { totalAmount: 0, bookingCount: 0 };
        current.totalAmount += Number(b.amount) || 0;
        current.bookingCount += 1;
        breakdownMap.set(b.courtId, current);
    }

    const breakdown = Array.from(breakdownMap.entries()).map(([courtId, stats]) => ({
        courtId,
        courtName: idToName[courtId] || courtId,
        totalAmount: stats.totalAmount,
        bookingCount: stats.bookingCount,
    }));

    const totalAmount = breakdown.reduce((sum, item) => sum + item.totalAmount, 0);
    const bookingCount = confirmed.length;

    res.json({ 
        totalAmount, 
        bookingCount, 
        breakdown,
        totalActiveCourts: activeCourts.length,
    });
}

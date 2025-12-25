// src/controllers/managerController.js
import { db } from '../db.js';

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
        const newId = 'c' + (db.data.courts.length + 1);
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
    const { bank, accountNo, accountName } = req.body || {};
    if (!bank || !accountNo || !accountName) {
        return res.status(400).json({ message: 'Thiếu bank/accountNo/accountName' });
    }
    let p = db.data.paymentProfiles.find(x => x.ownerId === req.user.id);
    if (!p) {
        p = { id: 'pp_' + req.user.id, ownerId: req.user.id, bank, accountNo, accountName };
        db.data.paymentProfiles.push(p);
    } else {
        p.bank = bank;
        p.accountNo = accountNo;
        p.accountName = accountName;
    }
    db.write();
    res.json({ message: 'Đã cập nhật', profile: p });
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

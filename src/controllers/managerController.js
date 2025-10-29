// src/controllers/managerController.js
import { db } from '../db.js';

// xem tất cả sân thuộc về manager hiện tại
export function myCourts(req, res) {
    const items = db.data.courts.filter(c => c.ownerId === req.user.id);
    res.json(items);
}

// tạo/sửa sân (đặt về trạng thái 'pending' để chờ admin duyệt)
export function upsertCourt(req, res) {
    const { id, name, address, pricePerHour } = req.body || {};
    if (!name || !address || !pricePerHour) {
        return res.status(400).json({ message: 'Thiếu name/address/pricePerHour' });
    }
    if (id) {
        const c = db.data.courts.find(x => x.id === id && x.ownerId === req.user.id);
        if (!c) return res.status(404).json({ message: 'Không tìm thấy sân của bạn' });
        c.name = name; c.address = address; c.pricePerHour = Number(pricePerHour);
        if (c.status === 'active') c.status = 'pending'; // sửa thì quay lại chờ duyệt
    } else {
        const newId = 'c' + (db.data.courts.length + 1);
        db.data.courts.push({
            id: newId,
            name,
            address,
            pricePerHour: Number(pricePerHour),
            status: 'pending',
            images: [],
            ownerId: req.user.id
        });
    }
    db.write();
    res.json({ message: 'Đã lưu (chờ admin duyệt)' });
}


// xem tất cả đơn đặt sân thuộc các sân của manager
export function myOrders(req, res) {
    // lấy các sân thuộc manager
    const myCourts = db.data.courts.filter(c => c.ownerId === req.user.id);
    const idToName = Object.fromEntries(myCourts.map(c => [c.id, c.name]));
    const myCourtIds = myCourts.map(c => c.id);

    // ghép (join) tên sân vào mỗi booking
    const items = db.data.bookings
        .filter(b => myCourtIds.includes(b.courtId))
        .map(b => ({
            ...b,
            courtName: idToName[b.courtId] || b.courtId
        }));

    res.json(items);
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
        p.bank = bank; p.accountNo = accountNo; p.accountName = accountName;
    }
    db.write();
    res.json({ message: 'Đã cập nhật', profile: p });
}

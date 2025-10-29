// src/db.js
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import bcrypt from 'bcryptjs';

const defaultData = {
    users: [
        { id: 'u_admin', name: 'Admin', email: 'admin@pickleplay.dev', password: bcrypt.hashSync('123456', 8), role: 'admin', locked: false },
        { id: 'u_manager', name: 'Manager A', email: 'manager@pickleplay.dev', password: bcrypt.hashSync('123456', 8), role: 'manager', locked: false },
        { id: 'u_user', name: 'User A', email: 'user@pickleplay.dev', password: bcrypt.hashSync('123456', 8), role: 'user', locked: false }
    ],
    // <--- THÊM 3 BẢNG DƯỚI
    paymentProfiles: [
        { id: 'pp_manager', ownerId: 'u_manager', bank: 'Vietcombank', accountNo: '0123456789', accountName: 'MANAGER A' }
    ],
    courts: [
        // status: 'active'|'pending'|'rejected'|'maintenance'
        { id: 'c1', name: 'Pickle Park 1', address: '123 ABC, Hà Nội', pricePerHour: 120000, status: 'active', images: [], ownerId: 'u_manager' },
        { id: 'c2', name: 'Pickle Park 2', address: '456 XYZ, Hà Nội', pricePerHour: 150000, status: 'active', images: [], ownerId: 'u_manager' }
    ],
    bookings: [
        // { id, userId, courtId, date, startHour, endHour, amount, status: 'pending_payment'|'confirmed'|'rejected'|'cancelled' }
    ],
    transactions: [
        // { id, bookingId, amount, status: 'paid'|'failed', createdAt }
    ]
};

export let db;

export async function initDb() {
    const adapter = new JSONFile('pickleplay.json');
    db = new Low(adapter, defaultData);
    await db.read();
    if (!db.data || Object.keys(db.data).length === 0) {
        db.data = structuredClone(defaultData);
        await db.write();
    }
}

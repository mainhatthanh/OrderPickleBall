// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const SECRET = 'pickleplay-secret'; // demo

export function signToken(user) {
    return jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '2d' });
}

export function requireAuth(req, _res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    try {
        const payload = jwt.verify(token, SECRET);
        req.user = payload;
        const u = db.data.users.find(x => x.id === payload.id);
        if (!u || u.locked) return next(new Error('locked'));
        next();
    } catch {
        next(new Error('unauthorized'));
    }
}

export function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) return next(new Error('forbidden'));
        next();
    };
}

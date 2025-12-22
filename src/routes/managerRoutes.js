// src/routes/managerRoutes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
    myCourts,
    upsertCourt,
    myOrders,
    setPaymentProfile,
    approveBooking,
    rejectBooking
} from '../controllers/managerController.js';

const r = Router();
r.use(requireAuth, requireRole('manager'));

r.get('/courts', myCourts);
r.post('/courts/upsert', upsertCourt);

// có thể lọc: /manager/orders?status=pending
r.get('/orders', myOrders);

r.post('/payment-profile', setPaymentProfile);

// NEW: duyệt / từ chối booking pending
r.post('/orders/approve', approveBooking);
r.post('/orders/reject', rejectBooking);

export default r;

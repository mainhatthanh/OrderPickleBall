// src/routes/managerRoutes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { myCourts, upsertCourt, myOrders, setPaymentProfile } from '../controllers/managerController.js';

const r = Router();
r.use(requireAuth, requireRole('manager'));

r.get('/courts', myCourts);
r.post('/courts/upsert', upsertCourt);
r.get('/orders', myOrders);
r.post('/payment-profile', setPaymentProfile);

export default r;

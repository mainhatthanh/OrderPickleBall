// src/routes/adminRoutes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
    listPendingCourts, approveCourt, rejectCourt,
    listUsers, lockToggle
} from '../controllers/adminController.js';

const r = Router();
r.use(requireAuth, requireRole('admin'));

r.get('/courts/pending', listPendingCourts);
r.post('/courts/:id/approve', approveCourt);
r.post('/courts/:id/reject', rejectCourt);

r.get('/users', listUsers);
r.post('/users/:id/lock-toggle', lockToggle);

export default r;

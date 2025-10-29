// src/routes/statsRoutes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { summary } from '../controllers/statsController.js';

const r = Router();
r.get('/summary', requireAuth, requireRole('admin'), summary);
export default r;

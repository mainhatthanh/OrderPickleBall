// src/routes/index.js
import { Router } from 'express';
import auth from './authRoutes.js';
import courts from './courtRoutes.js';
import bookings from './bookingRoutes.js';
import manager from './managerRoutes.js';
import admin from './adminRoutes.js';    // <---
import stats from './statsRoutes.js';    // <---

const router = Router();
router.use('/auth', auth);
router.use('/courts', courts);
router.use('/bookings', bookings);
router.use('/manager', manager);
router.use('/admin', admin);             // <---
router.use('/stats', stats);             // <---

export default router;

import { Router } from 'express';
import { listMy, create, confirmPaid, submitProof } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadPaymentProof } from '../middleware/uploadPaymentProof.js';

const r = Router();
r.use(requireAuth);

r.get('/me', listMy);
r.post('/', create);

// NEW: upload minh chứng
r.post('/submit-proof', uploadPaymentProof.single('paymentProof'), submitProof);

// route cũ demo
r.post('/confirm-paid', confirmPaid);

export default r;

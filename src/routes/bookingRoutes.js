import { Router } from 'express';
import { listMy, create, confirmPaid, submitProof, getBookedSlots } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadPaymentProof } from '../middleware/uploadPaymentProof.js';

const r = Router();

// Route công khai - lấy các slot đã đặt (không cần đăng nhập để xem lịch)
r.get('/slots/:courtId', getBookedSlots);

r.use(requireAuth);

r.get('/me', listMy);
r.post('/', create);
r.post('/submit-proof', uploadPaymentProof.single('paymentProof'), submitProof);
r.post('/confirm-paid', confirmPaid);

export default r;

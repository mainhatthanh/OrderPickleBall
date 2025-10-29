import { Router } from 'express';
import { listMy, create, confirmPaid } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();
r.use(requireAuth);                 // các API booking yêu cầu đăng nhập
r.get('/me', listMy);               // danh sách lịch của tôi
r.post('/', create);                // tạo booking (pending_payment)
r.post('/confirm-paid', confirmPaid); // mô phỏng nút "Tôi đã chuyển tiền"

export default r;

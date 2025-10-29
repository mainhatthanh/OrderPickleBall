import { Router } from 'express';
import { listPublic, detail } from '../controllers/courtController.js';

const r = Router();
r.get('/', listPublic);
r.get('/:id', detail); // chi tiết sân công khai
export default r;
// src/routes/authRoutes.js
import { Router } from 'express';
import { login, register } from '../controllers/authController.js';

const r = Router();
r.post('/login', login);
r.post('/register', register);

export default r;

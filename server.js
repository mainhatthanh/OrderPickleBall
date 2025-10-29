// server.js
import express from 'express';
import cors from 'cors';
import router from './src/routes/index.js';
import { initDb } from './src/db.js';

const app = express();
app.use(cors());
app.use(express.json());

// init DB
await initDb();

// health
app.get('/health', (_req, res) => res.json({ ok: true, service: 'PicklePlay API' }));

// API
app.use('/api', router);

// error handler gọn
app.use((err, _req, res, _next) => {
    const map = { unauthorized: 401, forbidden: 403, locked: 403 };
    const code = map[err.message] || 500;
    res.status(code).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`PicklePlay API http://localhost:${PORT}`));

import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { teachersRouter } from './routes/teachers.router';
import { rectorsRouter } from './routes/rectors.router';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// API
app.use('/api/teachers', teachersRouter);
app.use('/api/rectors', rectorsRouter);
// Статика в проде
app.use(express.static(path.join(__dirname, '../dist/client')));
app.get('/', (_req, res) => {
	res.sendFile(path.join(__dirname, '../dist/client/index.html'));
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

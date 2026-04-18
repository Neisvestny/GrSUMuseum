import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { env } from './env';
import { rectorsRouter } from './routes/rectors.router';
import { teachersRouter } from './routes/teachers.router';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = env.PORT;

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

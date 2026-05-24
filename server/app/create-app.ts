import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../env';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { menuRouter } from '../modules/menu';
import { pagesRouter } from '../modules/pages';
import { peopleRouter } from '../modules/people';
import { mediaRouter } from '../routes/media.router';
import { errorHandler } from './middleware/error-handler';

export function createApp() {
	const app = express();

	app.use(cors({ origin: env.CORS_ORIGIN }));
	app.use(express.json());

	app.use('/api/people', peopleRouter);
	app.use('/api/media', mediaRouter);
	app.use('/api/pages', pagesRouter);
	app.use('/api/menu', menuRouter);

	// Статика загруженных файлов: /images, /videos, /files
	const publicDir = path.join(__dirname, '../../public');
	app.use(express.static(publicDir));

	app.use(errorHandler);

	return app;
}

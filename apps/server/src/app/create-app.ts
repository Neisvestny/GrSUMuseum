import cors from 'cors';
import express from 'express';
import { env } from '../env';
import { webPublicDir } from '../lib/paths.js';
import { registerRoutes } from '../routes/index';
import { errorHandler } from './middleware/error-handler';

export function createApp() {
	const app = express();

	app.use(cors({ origin: env.CORS_ORIGIN }));
	app.use(express.json());

	registerRoutes(app);

	// Uploaded media static files: /images, /videos, /files
	app.use(express.static(webPublicDir));

	app.use(errorHandler);

	return app;
}

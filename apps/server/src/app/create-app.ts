import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../auth/index.js';
import { env } from '../env';
import { webPublicDir } from '../lib/paths.js';
import { registerRoutes } from '../routes/index';
import { errorHandler } from './middleware/error-handler';

const authRateLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Слишком много попыток. Попробуйте позже.' },
});

export function createApp() {
	const app = express();

	app.use(
		cors({
			origin: env.CORS_ORIGIN,
			credentials: true,
		}),
	);
	app.use(
		helmet({
			crossOriginResourcePolicy: { policy: 'cross-origin' },
		}),
	);

	app.use('/api/auth', authRateLimiter);
	app.all('/api/auth/*splat', toNodeHandler(auth));

	app.use(express.json());

	registerRoutes(app);

	// Uploaded media static files: /images, /videos, /files
	app.use(express.static(webPublicDir));

	app.use(errorHandler);

	return app;
}

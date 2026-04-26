import cors from 'cors';
import express from 'express';
import { env } from '../env';
import { rectorsRouter } from '../modules/rectors';
import { teachersRouter } from '../modules/teachers';
import { errorHandler } from './middleware/error-handler';

export function createApp() {
	const app = express();

	app.use(cors({ origin: env.CORS_ORIGIN }));
	app.use(express.json());

	app.use('/api/teachers', teachersRouter);
	app.use('/api/rectors', rectorsRouter);

	app.use(errorHandler);

	return app;
}

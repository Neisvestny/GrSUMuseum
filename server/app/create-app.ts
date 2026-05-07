import cors from 'cors';
import express from 'express';
import { env } from '../env';
import { galleryRouter } from '../modules/gallery';
import { menuRouter } from '../modules/menu';
import { pagesRouter } from '../modules/pages';
import { rectorsRouter } from '../modules/rectors';
import { teachersRouter } from '../modules/teachers';
import { filesRouter } from '../routes/files.router';
import { imagesRouter } from '../routes/images.router';
import { errorHandler } from './middleware/error-handler';

export function createApp() {
	const app = express();

	app.use(cors({ origin: env.CORS_ORIGIN }));
	app.use(express.json());

	app.use('/api/teachers', teachersRouter);
	app.use('/api/rectors', rectorsRouter);
	app.use('/api/images', imagesRouter);
	app.use('/api/files', filesRouter);
	app.use('/api/pages', pagesRouter);
	app.use('/api/menu', menuRouter);
	app.use('/api/gallery', galleryRouter);

	app.use(errorHandler);

	return app;
}

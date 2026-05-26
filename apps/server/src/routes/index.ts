import type { Express } from 'express';
import { menuRouter } from '../modules/menu';
import { pagesRouter } from '../modules/pages';
import { peopleRouter } from '../modules/people';
import { mediaRouter } from './media.router';

export function registerRoutes(app: Express): void {
	app.use('/api/people', peopleRouter);
	app.use('/api/media', mediaRouter);
	app.use('/api/pages', pagesRouter);
	app.use('/api/menu', menuRouter);
}

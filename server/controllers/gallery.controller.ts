import type { NextFunction, Request, Response } from 'express';
import type { GalleryService } from '../services/gallery.service';

export class GalleryController {
	constructor(private service: GalleryService) {}

	getPhotos = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			res.json(await this.service.getPhotos());
		} catch (err) {
			next(err);
		}
	};

	getVideos = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			res.json(await this.service.getVideos());
		} catch (err) {
			next(err);
		}
	};
}

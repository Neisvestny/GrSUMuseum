import type { NextFunction, Request, Response } from 'express';
import type { GalleryService } from '../services/gallery.service';
import { HttpError } from '../shared/errors';

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

	// POST /api/gallery/photos
	createPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		if (!isPhotoPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			res.status(201).json(await this.service.createPhoto(req.body));
		} catch (err) {
			next(err);
		}
	};

	// PUT /api/gallery/photos/:id
	updatePhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}
		if (!isPhotoPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const row = await this.service.updatePhoto(id, req.body);
			if (!row) {
				next(new HttpError(404, 'Фото не найдено'));
				return;
			}
			res.json(row);
		} catch (err) {
			next(err);
		}
	};

	// DELETE /api/gallery/photos/:id
	deletePhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}
		try {
			const ok = await this.service.deletePhoto(id);
			if (!ok) {
				next(new HttpError(404, 'Фото не найдено'));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	// PATCH /api/gallery/photos/reorder { year, orderedIds }
	reorderPhotos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const year = Number(req.body?.year);
		const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : null;
		if (!Number.isFinite(year)) {
			next(new HttpError(400, 'year должен быть числом'));
			return;
		}
		if (!orderedIds || !orderedIds.every((n: unknown) => typeof n === 'number' && Number.isFinite(n))) {
			next(new HttpError(400, 'orderedIds должен быть массивом чисел'));
			return;
		}
		try {
			await this.service.reorderPhotos(year, orderedIds as number[]);
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	// POST /api/gallery/videos
	createVideo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		if (!isVideoPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			res.status(201).json(await this.service.createVideo(req.body));
		} catch (err) {
			next(err);
		}
	};

	// PUT /api/gallery/videos/:id
	updateVideo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}
		if (!isVideoPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const row = await this.service.updateVideo(id, req.body);
			if (!row) {
				next(new HttpError(404, 'Видео не найдено'));
				return;
			}
			res.json(row);
		} catch (err) {
			next(err);
		}
	};

	// DELETE /api/gallery/videos/:id
	deleteVideo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}
		try {
			const ok = await this.service.deleteVideo(id);
			if (!ok) {
				next(new HttpError(404, 'Видео не найдено'));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	// PATCH /api/gallery/videos/reorder { orderedIds }
	reorderVideos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : null;
		if (!orderedIds || !orderedIds.every((n: unknown) => typeof n === 'number' && Number.isFinite(n))) {
			next(new HttpError(400, 'orderedIds должен быть массивом чисел'));
			return;
		}
		try {
			await this.service.reorderVideos(orderedIds as number[]);
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};
}

function isPhotoPayload(value: unknown): value is {
	src?: string;
	title?: string;
	annotation?: string;
	year?: number;
	position?: number;
} {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	return (
		(v.src === undefined || typeof v.src === 'string') &&
		(v.title === undefined || typeof v.title === 'string') &&
		(v.annotation === undefined || typeof v.annotation === 'string') &&
		(v.year === undefined || typeof v.year === 'number') &&
		(v.position === undefined || typeof v.position === 'number')
	);
}

function isVideoPayload(value: unknown): value is {
	src?: string;
	title?: string;
	description?: string;
	tags?: string[];
	duration?: string | null;
	is_external?: boolean;
	position?: number;
} {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	return (
		(v.src === undefined || typeof v.src === 'string') &&
		(v.title === undefined || typeof v.title === 'string') &&
		(v.description === undefined || typeof v.description === 'string') &&
		(v.tags === undefined || (Array.isArray(v.tags) && v.tags.every((t) => typeof t === 'string'))) &&
		(v.duration === undefined || v.duration === null || typeof v.duration === 'string') &&
		(v.is_external === undefined || typeof v.is_external === 'boolean') &&
		(v.position === undefined || typeof v.position === 'number')
	);
}

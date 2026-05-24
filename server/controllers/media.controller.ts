import type { NextFunction, Request, Response } from 'express';
import {
	isMediaRoot,
	MEDIA_ROOTS,
	publicBaseUrl,
	type MediaRoot,
} from '../lib/media-storage.js';
import type { MediaService } from '../services/media.service.js';
import { HttpError } from '../shared/errors.js';

function parseRoot(raw: unknown): MediaRoot {
	if (isMediaRoot(raw)) return raw;
	return 'images';
}

export class MediaController {
	constructor(private media: MediaService) {}

	getRoots = (_req: Request, res: Response): void => {
		res.json({
			roots: MEDIA_ROOTS.map((id) => ({ id, baseUrl: publicBaseUrl(id) })),
		});
	};

	browse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const root = parseRoot(req.query.root);
			const dir = typeof req.query.dir === 'string' ? req.query.dir : '';
			const entries = await this.media.browse(root, dir);
			res.json({
				root,
				dir,
				baseUrl: publicBaseUrl(root),
				entries,
			});
		} catch (err) {
			next(err);
		}
	};

	search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const root = parseRoot(req.query.root);
			const q = typeof req.query.q === 'string' ? req.query.q : '';
			const files = await this.media.searchFiles(root, q);
			res.json({ root, baseUrl: publicBaseUrl(root), files });
		} catch (err) {
			next(err);
		}
	};

	updateAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}
		const body = req.body as Record<string, unknown>;
		try {
			const row = await this.media.updateAssetMetadata(id, {
				title: typeof body.title === 'string' ? body.title : undefined,
				alt: typeof body.alt === 'string' ? body.alt : undefined,
				showInPhotoGallery:
					typeof body.showInPhotoGallery === 'boolean'
						? body.showInPhotoGallery
						: undefined,
				showInVideoGallery:
					typeof body.showInVideoGallery === 'boolean'
						? body.showInVideoGallery
						: undefined,
				year: typeof body.year === 'number' ? body.year : undefined,
				annotation: typeof body.annotation === 'string' ? body.annotation : undefined,
				description: typeof body.description === 'string' ? body.description : undefined,
				tags: Array.isArray(body.tags)
					? (body.tags as unknown[]).filter((t): t is string => typeof t === 'string')
					: undefined,
				duration:
					body.duration === null || typeof body.duration === 'string'
						? body.duration
						: undefined,
				is_external:
					typeof body.is_external === 'boolean' ? body.is_external : undefined,
			});
			if (!row) {
				next(new HttpError(404, 'Файл не найден'));
				return;
			}
			res.json(row);
		} catch (err) {
			next(err);
		}
	};

	registerLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const body = req.body as Record<string, unknown>;
		try {
			const row = await this.media.registerLink({
				src: typeof body.src === 'string' ? body.src : '',
				root: isMediaRoot(body.root) ? body.root : undefined,
				title: typeof body.title === 'string' ? body.title : undefined,
				showInPhotoGallery:
					typeof body.showInPhotoGallery === 'boolean'
						? body.showInPhotoGallery
						: undefined,
				showInVideoGallery:
					typeof body.showInVideoGallery === 'boolean'
						? body.showInVideoGallery
						: undefined,
				description: typeof body.description === 'string' ? body.description : undefined,
				tags: Array.isArray(body.tags)
					? (body.tags as unknown[]).filter((t): t is string => typeof t === 'string')
					: undefined,
				duration:
					body.duration === null || typeof body.duration === 'string'
						? body.duration
						: undefined,
				is_external:
					typeof body.is_external === 'boolean' ? body.is_external : undefined,
				year: typeof body.year === 'number' ? body.year : undefined,
				annotation: typeof body.annotation === 'string' ? body.annotation : undefined,
			});
			res.status(201).json(row);
		} catch (err) {
			next(err);
		}
	};

	getPhotos = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			res.json(await this.media.getPhotos());
		} catch (err) {
			next(err);
		}
	};

	getVideos = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			res.json(await this.media.getVideos());
		} catch (err) {
			next(err);
		}
	};

	reorderPhotos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const year = Number(req.body?.year);
		const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : null;
		if (!Number.isFinite(year) || !orderedIds) {
			next(new HttpError(400, 'year и orderedIds обязательны'));
			return;
		}
		try {
			await this.media.reorderPhotos(
				year,
				(orderedIds as unknown[]).filter((n): n is number => typeof n === 'number'),
			);
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	reorderVideos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : null;
		if (!orderedIds) {
			next(new HttpError(400, 'orderedIds обязателен'));
			return;
		}
		try {
			await this.media.reorderVideos(
				(orderedIds as unknown[]).filter((n): n is number => typeof n === 'number'),
			);
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};
}

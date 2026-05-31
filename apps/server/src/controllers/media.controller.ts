import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
	isMediaRoot,
	MEDIA_ROOTS,
	publicBaseUrl,
	type MediaRoot,
} from '../lib/media-storage.js';
import { fetchYoutubeMeta } from '../lib/remote-video-meta.js';
import type { MediaService } from '../services/media.service.js';
import { MediaStorageService } from '../services/media-storage.service.js';
import { ApiMessage } from '../shared/api-messages.js';
import { HttpError } from '../shared/errors.js';

function parseRoot(raw: unknown): MediaRoot {
	if (isMediaRoot(raw)) return raw;
	return 'images';
}

export class MediaController {
	constructor(
		private media: MediaService,
		private storage: MediaStorageService,
	) {}

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

	remoteMeta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const url = typeof req.query.url === 'string' ? req.query.url.trim() : '';
			if (!url) {
				res.json({});
				return;
			}
			const meta = await fetchYoutubeMeta(url);
			res.json(meta ?? {});
		} catch (err) {
			next(err);
		}
	};

	updateAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
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
				src: typeof body.src === 'string' ? body.src : undefined,
			});
			if (!row) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.FILE_NOT_FOUND));
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
			res.status(StatusCodes.CREATED).json(row);
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
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.YEAR_AND_ORDERED_IDS_REQUIRED));
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
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ORDERED_IDS_REQUIRED));
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

	mkdir = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const root = MediaStorageService.parseRoot(req.body?.root);
			const dir = typeof req.body?.dir === 'string' ? req.body.dir : '';
			const name = typeof req.body?.name === 'string' ? req.body.name : '';
			await this.storage.mkdir(root, dir, name);
			res.status(StatusCodes.CREATED).json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	rename = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const root = MediaStorageService.parseRoot(req.body?.root);
			const relPath = typeof req.body?.path === 'string' ? req.body.path : '';
			const newName = typeof req.body?.newName === 'string' ? req.body.newName : '';
			const targetRel = await this.storage.rename(root, relPath, newName);
			res.json({ success: true, path: targetRel });
		} catch (err) {
			next(err);
		}
	};

	move = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const root = MediaStorageService.parseRoot(req.body?.root);
			const relPath = typeof req.body?.path === 'string' ? req.body.path : '';
			const toDir = typeof req.body?.toDir === 'string' ? req.body.toDir : '';
			const newName = typeof req.body?.newName === 'string' ? req.body.newName : undefined;
			const targetRel = await this.storage.move(root, relPath, toDir, newName);
			res.json({ success: true, path: targetRel });
		} catch (err) {
			next(err);
		}
	};

	deleteItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const root = MediaStorageService.parseRoot(req.query.root);
			const relPath = typeof req.query.path === 'string' ? req.query.path : '';
			await this.storage.deleteItem(root, relPath);
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const root = MediaStorageService.parseRoot(req.query.root);
			const dir = typeof req.query.dir === 'string' ? req.query.dir : '';
			const files = (req.files ?? []) as Express.Multer.File[];
			const saved = await this.storage.uploadFiles(
				root,
				dir,
				files.map((f) => ({ originalName: f.originalname, buffer: f.buffer })),
			);
			res.status(StatusCodes.CREATED).json({ success: true, files: saved });
		} catch (err) {
			next(err);
		}
	};

	uploadUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const root = MediaStorageService.parseRoot(req.body?.root);
			const url = typeof req.body?.url === 'string' ? req.body.url : '';
			const dir = typeof req.body?.dir === 'string' ? req.body.dir : '';
			const filename = typeof req.body?.filename === 'string' ? req.body.filename : undefined;
			const file = await this.storage.uploadFromUrl(root, dir, url, filename);
			res.status(StatusCodes.CREATED).json({
				success: true,
				file: file.external
					? { url: file.url, assetId: file.assetId, external: true }
					: {
							name: file.name,
							relPath: file.relPath,
							url: file.url,
							assetId: file.assetId,
						},
			});
		} catch (err) {
			next(err);
		}
	};
}

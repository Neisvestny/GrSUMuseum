import fs from 'fs/promises';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { MediaController } from '../controllers/media.controller.js';
import { prisma } from '../db/prisma';
import {
	ensureRootDirs,
	isMediaRoot,
	normalizeRel,
	publicUrl,
	resolveInsideRoot,
	uniqueTargetPath,
	type MediaRoot,
} from '../lib/media-storage.js';
import { MediaService } from '../services/media.service.js';
import { HttpError } from '../shared/errors.js';

const service = new MediaService(prisma);
const controller = new MediaController(service);

const upload = multer({ storage: multer.memoryStorage() });

function parseRootParam(raw: unknown, fallback: MediaRoot = 'images'): MediaRoot {
	return isMediaRoot(raw) ? raw : fallback;
}

export const mediaRouter = Router();

void ensureRootDirs();

mediaRouter.get('/roots', controller.getRoots);
mediaRouter.get('/browse', controller.browse);
mediaRouter.get('/search', controller.search);
mediaRouter.patch('/assets/:id', controller.updateAsset);
mediaRouter.post('/assets/link', controller.registerLink);

mediaRouter.get('/gallery/photos', controller.getPhotos);
mediaRouter.get('/gallery/videos', controller.getVideos);
mediaRouter.patch('/gallery/photos/reorder', controller.reorderPhotos);
mediaRouter.patch('/gallery/videos/reorder', controller.reorderVideos);

mediaRouter.post('/mkdir', async (req, res, next) => {
	try {
		const root = parseRootParam(req.body?.root);
		const dir = normalizeRel(req.body?.dir);
		const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
		if (!name) throw new HttpError(400, 'name обязателен');
		if (name.includes('/') || name.includes('\\')) throw new HttpError(400, 'Некорректное имя');
		const rel = dir ? `${dir}/${name}` : name;
		await fs.mkdir(resolveInsideRoot(root, rel), { recursive: false });
		res.status(201).json({ success: true });
	} catch (err) {
		next(err);
	}
});

mediaRouter.post('/rename', async (req, res, next) => {
	try {
		const root = parseRootParam(req.body?.root);
		const relPath = normalizeRel(req.body?.path);
		const newName = typeof req.body?.newName === 'string' ? req.body.newName.trim() : '';
		if (!relPath) throw new HttpError(400, 'path обязателен');
		if (!newName) throw new HttpError(400, 'newName обязателен');
		if (newName.includes('/') || newName.includes('\\')) throw new HttpError(400, 'Некорректное имя');

		const parentRel = relPath.split('/').slice(0, -1).join('/');
		const targetRel = parentRel ? `${parentRel}/${newName}` : newName;

		await fs.rename(resolveInsideRoot(root, relPath), resolveInsideRoot(root, targetRel));
		await service.renameAssetSrc(root, relPath, targetRel);

		res.json({ success: true, path: targetRel });
	} catch (err) {
		next(err);
	}
});

mediaRouter.post('/move', async (req, res, next) => {
	try {
		const root = parseRootParam(req.body?.root);
		const relPath = normalizeRel(req.body?.path);
		const toDir = normalizeRel(req.body?.toDir);
		const newName = typeof req.body?.newName === 'string' ? req.body.newName.trim() : '';
		if (!relPath) throw new HttpError(400, 'path обязателен');

		const name = newName || relPath.split('/').at(-1) || '';
		if (!name) throw new HttpError(400, 'Некорректное имя');

		const targetRel = toDir ? `${toDir}/${name}` : name;
		await fs.mkdir(resolveInsideRoot(root, toDir), { recursive: true });
		await fs.rename(resolveInsideRoot(root, relPath), resolveInsideRoot(root, targetRel));
		await service.renameAssetSrc(root, relPath, targetRel);

		res.json({ success: true, path: targetRel });
	} catch (err) {
		next(err);
	}
});

mediaRouter.delete('/item', async (req, res, next) => {
	try {
		const root = parseRootParam(req.query.root);
		const relPath = normalizeRel(req.query.path);
		if (!relPath) throw new HttpError(400, 'path обязателен');

		const abs = resolveInsideRoot(root, relPath);
		const st = await fs.stat(abs).catch(() => null);
		if (!st) throw new HttpError(404, 'Не найдено');

		await service.softDeleteAssetsForPath(root, relPath);

		if (st.isDirectory()) {
			await fs.rm(abs, { recursive: true, force: true });
		} else {
			await fs.unlink(abs);
		}

		res.json({ success: true });
	} catch (err) {
		next(err);
	}
});

mediaRouter.post('/upload', upload.array('files'), async (req, res, next) => {
	try {
		const root = parseRootParam(req.query.root);
		const dir = normalizeRel(req.query.dir);
		const absDir = resolveInsideRoot(root, dir);
		await fs.mkdir(absDir, { recursive: true });

		const files = (req.files ?? []) as Express.Multer.File[];
		if (!files.length) throw new HttpError(400, 'files обязателен');

		const saved: Array<{ name: string; relPath: string; url: string; assetId: number }> = [];
		for (const f of files) {
			const fileName = f.originalname?.trim() || 'file';
			const targetAbs = await uniqueTargetPath(absDir, fileName);
			await fs.writeFile(targetAbs, f.buffer);
			const name = path.basename(targetAbs);
			const relPath = dir ? `${dir}/${name}` : name;
			const asset = await service.upsertFromStorage(root, relPath);
			saved.push({
				name,
				relPath,
				url: publicUrl(root, relPath),
				assetId: asset.id,
			});
		}

		res.status(201).json({ success: true, files: saved });
	} catch (err) {
		next(err);
	}
});

mediaRouter.post('/upload-url', async (req, res, next) => {
	try {
		const root = parseRootParam(req.body?.root);
		const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
		const dir = normalizeRel(req.body?.dir);
		const filename = typeof req.body?.filename === 'string' ? req.body.filename.trim() : '';
		if (!url) throw new HttpError(400, 'url обязателен');

		if (/^https?:\/\//i.test(url)) {
			const asset = await service.registerLink({
				src: url,
				root,
				title: filename || url,
				is_external: true,
				showInVideoGallery: root === 'videos',
			});
			res.status(201).json({
				success: true,
				file: { url, assetId: asset.id, external: true },
			});
			return;
		}

		const absDir = resolveInsideRoot(root, dir);
		await fs.mkdir(absDir, { recursive: true });

		const r = await fetch(url);
		if (!r.ok) throw new HttpError(400, `Не удалось скачать (${r.status})`);
		const buf = Buffer.from(await r.arrayBuffer());

		let name = filename;
		if (!name) {
			try {
				const u = new URL(url);
				name = decodeURIComponent(u.pathname.split('/').pop() || '').trim();
			} catch {
				name = '';
			}
		}
		if (!name) name = 'download';

		const targetAbs = await uniqueTargetPath(absDir, name);
		await fs.writeFile(targetAbs, buf);
		const savedName = path.basename(targetAbs);
		const relPath = dir ? `${dir}/${savedName}` : savedName;
		const asset = await service.upsertFromStorage(root, relPath);

		res.status(201).json({
			success: true,
			file: {
				name: savedName,
				relPath,
				url: publicUrl(root, relPath),
				assetId: asset.id,
			},
		});
	} catch (err) {
		next(err);
	}
});

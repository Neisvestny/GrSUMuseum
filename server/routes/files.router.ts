import fs from 'fs/promises';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../db/prisma';
import { HttpError } from '../shared/errors';

type EntryDto = {
	name: string;
	kind: 'file' | 'dir';
	relPath: string; // posix, relative to /public/images (no leading slash)
	size?: number;
	mtimeMs?: number;
};

const IMAGES_ROOT = path.join(process.cwd(), 'public', 'images');

function toPosix(p: string): string {
	return p.replace(/\\/g, '/');
}

function normalizeRel(raw: unknown): string {
	const v = typeof raw === 'string' ? raw : '';
	return toPosix(v).trim().replace(/^\/+|\/+$/g, '');
}

function resolveInsideImagesRoot(rel: string): string {
	const abs = path.resolve(IMAGES_ROOT, rel);
	const root = path.resolve(IMAGES_ROOT);
	const withSep = root.endsWith(path.sep) ? root : root + path.sep;
	if (abs !== root && !abs.startsWith(withSep)) {
		throw new HttpError(400, 'Недопустимый путь');
	}
	return abs;
}

async function ensureDirExists(absDir: string): Promise<void> {
	await fs.mkdir(absDir, { recursive: true });
}

async function safeStat(absPath: string) {
	try {
		return await fs.stat(absPath);
	} catch {
		return null;
	}
}

async function listDir(relDir: string): Promise<EntryDto[]> {
	const absDir = resolveInsideImagesRoot(relDir);
	await ensureDirExists(absDir);
	const entries = await fs.readdir(absDir, { withFileTypes: true });

	const out: EntryDto[] = [];
	for (const e of entries) {
		const nextRel = relDir ? `${relDir}/${e.name}` : e.name;
		if (e.isDirectory()) {
			out.push({ name: e.name, kind: 'dir', relPath: nextRel });
			continue;
		}
		if (e.isFile()) {
			const st = await safeStat(path.join(absDir, e.name));
			out.push({
				name: e.name,
				kind: 'file',
				relPath: nextRel,
				size: st?.size,
				mtimeMs: st?.mtimeMs,
			});
		}
	}

	// папки сначала, затем файлы
	out.sort((a, b) => {
		if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
		return a.name.localeCompare(b.name, 'ru');
	});
	return out;
}

function normalizePublicUrlFromRel(relPath: string): string {
	const cleaned = normalizeRel(relPath);
	return cleaned ? `/images/${cleaned}` : '/images/';
}

async function cleanupMediaRecordsForDeletedPath(relPath: string): Promise<void> {
	const cleaned = normalizeRel(relPath);
	if (!cleaned) return;
	const url = normalizePublicUrlFromRel(cleaned);
	const urlPrefix = url.endsWith('/') ? url : `${url}/`;

	// Точно удаляем по равенству, а для каталогов — по префиксу
	const now = new Date();
	await prisma.mediaAsset.updateMany({
		where: {
			deletedAt: null,
			OR: [
				{ src: url },
				{ src: cleaned },
				{ src: `/${cleaned}` },
				{ src: toPosix(url) },
				{ src: { startsWith: urlPrefix } },
			],
		},
		data: { deletedAt: now },
	});
}

async function uniqueTargetPath(absDir: string, fileName: string): Promise<string> {
	const base = path.parse(fileName).name;
	const ext = path.parse(fileName).ext;
	let candidate = fileName;
	let i = 1;
	while (await safeStat(path.join(absDir, candidate))) {
		i += 1;
		candidate = `${base} (${i})${ext}`;
	}
	return path.join(absDir, candidate);
}

const upload = multer({ storage: multer.memoryStorage() });

export const filesRouter = Router();

// GET /api/files?dir=some/subdir
filesRouter.get('/', async (req, res, next) => {
	try {
		const dir = normalizeRel(req.query.dir);
		const entries = await listDir(dir);
		res.json({
			dir,
			baseUrl: '/images/',
			entries,
		});
	} catch (err) {
		next(err);
	}
});

// POST /api/files/mkdir { dir, name }
filesRouter.post('/mkdir', async (req, res, next) => {
	try {
		const dir = normalizeRel(req.body?.dir);
		const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
		if (!name) throw new HttpError(400, 'name обязателен');
		if (name.includes('/') || name.includes('\\')) throw new HttpError(400, 'Некорректное имя');
		const abs = resolveInsideImagesRoot(dir ? `${dir}/${name}` : name);
		await fs.mkdir(abs, { recursive: false });
		res.status(201).json({ success: true });
	} catch (err) {
		next(err);
	}
});

// POST /api/files/rename { path, newName }
filesRouter.post('/rename', async (req, res, next) => {
	try {
		const relPath = normalizeRel(req.body?.path);
		const newName = typeof req.body?.newName === 'string' ? req.body.newName.trim() : '';
		if (!relPath) throw new HttpError(400, 'path обязателен');
		if (!newName) throw new HttpError(400, 'newName обязателен');
		if (newName.includes('/') || newName.includes('\\')) throw new HttpError(400, 'Некорректное имя');

		const abs = resolveInsideImagesRoot(relPath);
		const parentRel = relPath.split('/').slice(0, -1).join('/');
		const targetRel = parentRel ? `${parentRel}/${newName}` : newName;
		const targetAbs = resolveInsideImagesRoot(targetRel);

		await fs.rename(abs, targetAbs);
		res.json({ success: true, path: targetRel });
	} catch (err) {
		next(err);
	}
});

// POST /api/files/move { path, toDir, newName? }
filesRouter.post('/move', async (req, res, next) => {
	try {
		const relPath = normalizeRel(req.body?.path);
		const toDir = normalizeRel(req.body?.toDir);
		const newName = typeof req.body?.newName === 'string' ? req.body.newName.trim() : '';
		if (!relPath) throw new HttpError(400, 'path обязателен');

		const abs = resolveInsideImagesRoot(relPath);
		const name = newName || relPath.split('/').at(-1) || '';
		if (!name) throw new HttpError(400, 'Некорректное имя');
		if (name.includes('/') || name.includes('\\')) throw new HttpError(400, 'Некорректное имя');

		const destDirAbs = resolveInsideImagesRoot(toDir);
		await ensureDirExists(destDirAbs);

		const targetRel = toDir ? `${toDir}/${name}` : name;
		const targetAbs = resolveInsideImagesRoot(targetRel);

		await fs.rename(abs, targetAbs);
		res.json({ success: true, path: targetRel });
	} catch (err) {
		next(err);
	}
});

// DELETE /api/files?path=...
filesRouter.delete('/', async (req, res, next) => {
	try {
		const relPath = normalizeRel(req.query.path);
		if (!relPath) throw new HttpError(400, 'path обязателен');
		const abs = resolveInsideImagesRoot(relPath);
		const st = await safeStat(abs);
		if (!st) throw new HttpError(404, 'Не найдено');

		await cleanupMediaRecordsForDeletedPath(relPath);

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

// POST /api/files/upload?dir=... (multipart: files[])
filesRouter.post('/upload', upload.array('files'), async (req, res, next) => {
	try {
		const dir = normalizeRel(req.query.dir);
		const absDir = resolveInsideImagesRoot(dir);
		await ensureDirExists(absDir);

		const files = (req.files ?? []) as Express.Multer.File[];
		if (!files.length) throw new HttpError(400, 'files обязателен');

		const saved: Array<{ name: string; relPath: string; url: string }> = [];
		for (const f of files) {
			const fileName = f.originalname?.trim() || 'file';
			const targetAbs = await uniqueTargetPath(absDir, fileName);
			await fs.writeFile(targetAbs, f.buffer);
			const name = path.basename(targetAbs);
			const relPath = dir ? `${dir}/${name}` : name;
			saved.push({ name, relPath, url: normalizePublicUrlFromRel(relPath) });
		}

		res.status(201).json({ success: true, files: saved });
	} catch (err) {
		next(err);
	}
});

// POST /api/files/upload-url { url, dir, filename? }
filesRouter.post('/upload-url', async (req, res, next) => {
	try {
		const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
		const dir = normalizeRel(req.body?.dir);
		const filename =
			typeof req.body?.filename === 'string' ? req.body.filename.trim() : '';
		if (!url) throw new HttpError(400, 'url обязателен');

		const absDir = resolveInsideImagesRoot(dir);
		await ensureDirExists(absDir);

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

		res.status(201).json({
			success: true,
			file: { name: savedName, relPath, url: normalizePublicUrlFromRel(relPath) },
		});
	} catch (err) {
		next(err);
	}
});


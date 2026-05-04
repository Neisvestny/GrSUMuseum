import fs from 'fs/promises';
import path from 'path';
import { Router } from 'express';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

async function listImageFiles(dir: string): Promise<string[]> {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		return entries
			.filter((e) => e.isFile())
			.map((e) => e.name)
			.filter((name) => IMAGE_EXTS.has(path.extname(name).toLowerCase()));
	} catch {
		return [];
	}
}

function uniqSorted(arr: string[]) {
	return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

export const imagesRouter = Router();

// GET /api/images?q=rector
imagesRouter.get('/', async (req, res, next) => {
	try {
		const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

		const candidates = [
			path.join(process.cwd(), 'public', 'images'),
			path.join(process.cwd(), 'dist', 'images'),
			path.join(process.cwd(), 'static', 'images'),
		];

		const all = (await Promise.all(candidates.map((dir) => listImageFiles(dir)))).flat();

		const files = uniqSorted(q ? all.filter((name) => name.toLowerCase().includes(q)) : all);

		res.json({
			files,
			baseUrl: '/images/',
		});
	} catch (error) {
		next(error);
	}
});

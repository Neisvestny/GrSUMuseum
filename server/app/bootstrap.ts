import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import type { Request, Response } from 'express';
import { ensureTeachersSectionConstraint } from '../db/ensure-schema';
import { pool } from '../db/pool';
import { env } from '../env';
import { createApp } from './create-app';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function bootstrap(): Promise<void> {
	await ensureTeachersSectionConstraint(pool);

	const app = createApp();
	const staticRoot = path.join(__dirname, '../../dist');
	app.use(express.static(staticRoot));
	app.get('/', (_req: Request, res: Response) => {
		res.sendFile(path.join(staticRoot, 'index.html'));
	});

	app.listen(env.PORT, () => {
		console.log(`Server running on http://localhost:${env.PORT}`);
	});
}

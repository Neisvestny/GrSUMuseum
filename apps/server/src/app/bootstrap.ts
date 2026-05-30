import path from 'path';
import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { env, assertProductionSecrets } from '../env';
import { webDistDir } from '../lib/paths.js';
import { createApp } from './create-app';

export async function bootstrap(): Promise<void> {
	assertProductionSecrets();
	await prisma.$connect();

	const app = createApp();
	const staticRoot = webDistDir;
	app.use(express.static(staticRoot));
	app.get('/', (_req: Request, res: Response) => {
		res.sendFile(path.join(staticRoot, 'index.html'));
	});
	app.get('/{*splat}', (req: Request, res: Response, next) => {
		if (req.path.startsWith('/api')) {
			next();
			return;
		}
		res.sendFile(path.join(staticRoot, 'index.html'));
	});

	app.listen(env.PORT, () => {
		console.log(`Server running on http://localhost:${env.PORT}`);
	});
}

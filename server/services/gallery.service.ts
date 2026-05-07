import type { PrismaClient } from '../generated/prisma/client.js';
import type { GalleryPhotoRow, GalleryVideoRow } from '../types';
import fs from 'fs/promises';
import path from 'path';
import { HttpError } from '../shared/errors';

export class GalleryService {
	constructor(private prisma: PrismaClient) {}

	async getPhotos(): Promise<GalleryPhotoRow[]> {
		const rows = await this.prisma.gallery_photos.findMany({
			orderBy: [{ year: 'asc' }, { position: 'asc' }],
		});
		return rows.map((r) => ({
			id: r.id,
			src: r.src,
			title: r.title,
			annotation: r.annotation,
			year: r.year,
			position: r.position,
		}));
	}

	async getVideos(): Promise<GalleryVideoRow[]> {
		const rows = await this.prisma.gallery_videos.findMany({
			orderBy: { position: 'asc' },
		});
		return rows.map((r) => ({
			id: r.id,
			src: r.src,
			title: r.title,
			description: r.description,
			tags: r.tags,
			duration: r.duration,
			is_external: r.is_external,
			position: r.position,
		}));
	}

	async createPhoto(data: {
		src?: string;
		title?: string;
		annotation?: string;
		year?: number;
		position?: number;
	}): Promise<GalleryPhotoRow> {
		const src = (data.src ?? '').trim();
		const title = (data.title ?? '').trim();
		const annotation = (data.annotation ?? '').trim();
		const year = Number(data.year);
		if (!src) throw new HttpError(400, 'src обязателен');
		if (!title) throw new HttpError(400, 'title обязателен');
		if (!Number.isFinite(year)) throw new HttpError(400, 'year обязателен');

		return this.prisma.$transaction(async (tx) => {
			const count = await tx.gallery_photos.count({ where: { year } });
			const insertPos =
				data.position !== undefined
					? Math.max(1, Math.min(Number(data.position), count + 1))
					: count + 1;
			await tx.gallery_photos.updateMany({
				where: { year, position: { gte: insertPos } },
				data: { position: { increment: 1 } },
			});
			const row = await tx.gallery_photos.create({
				data: { src, title, annotation, year, position: insertPos },
			});
			return {
				id: row.id,
				src: row.src,
				title: row.title,
				annotation: row.annotation,
				year: row.year,
				position: row.position,
			};
		});
	}

	async updatePhoto(
		id: number,
		data: {
			src?: string;
			title?: string;
			annotation?: string;
			year?: number;
			position?: number;
		},
	): Promise<GalleryPhotoRow | null> {
		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.gallery_photos.findUnique({ where: { id } });
			if (!existing) return null;

			const nextYear = data.year !== undefined ? Number(data.year) : existing.year;
			const movingYear = nextYear !== existing.year;

			if (movingYear) {
				// вынимаем из старого года
				await tx.gallery_photos.update({ where: { id }, data: { position: -id } });
				await tx.gallery_photos.updateMany({
					where: { year: existing.year, position: { gt: existing.position } },
					data: { position: { decrement: 1 } },
				});

				// вставляем в новый год
				const count = await tx.gallery_photos.count({ where: { year: nextYear } });
				const insertPos =
					data.position !== undefined
						? Math.max(1, Math.min(Number(data.position), count + 1))
						: count + 1;
				await tx.gallery_photos.updateMany({
					where: { year: nextYear, position: { gte: insertPos } },
					data: { position: { increment: 1 } },
				});
				await tx.gallery_photos.update({
					where: { id },
					data: {
						year: nextYear,
						position: insertPos,
						src: data.src?.trim() ?? undefined,
						title: data.title?.trim() ?? undefined,
						annotation: data.annotation?.trim() ?? undefined,
					},
				});
			} else if (data.position !== undefined && Number(data.position) !== existing.position) {
				const count = await tx.gallery_photos.count({ where: { year: existing.year } });
				const targetPos = Math.max(1, Math.min(Number(data.position), count));
				await tx.gallery_photos.update({ where: { id }, data: { position: -id } });

				if (targetPos > existing.position) {
					await tx.gallery_photos.updateMany({
						where: { year: existing.year, position: { gt: existing.position, lte: targetPos } },
						data: { position: { decrement: 1 } },
					});
				} else {
					await tx.gallery_photos.updateMany({
						where: { year: existing.year, position: { gte: targetPos, lt: existing.position } },
						data: { position: { increment: 1 } },
					});
				}

				await tx.gallery_photos.update({
					where: { id },
					data: {
						position: targetPos,
						src: data.src?.trim() ?? undefined,
						title: data.title?.trim() ?? undefined,
						annotation: data.annotation?.trim() ?? undefined,
					},
				});
			} else {
				await tx.gallery_photos.update({
					where: { id },
					data: {
						src: data.src?.trim() ?? undefined,
						title: data.title?.trim() ?? undefined,
						annotation: data.annotation?.trim() ?? undefined,
						year: data.year !== undefined ? nextYear : undefined,
					},
				});
			}

			const row = await tx.gallery_photos.findUniqueOrThrow({ where: { id } });
			return {
				id: row.id,
				src: row.src,
				title: row.title,
				annotation: row.annotation,
				year: row.year,
				position: row.position,
			};
		});
	}

	async deletePhoto(id: number): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const row = await tx.gallery_photos.findUnique({ where: { id } });
			if (!row) return false;
			await tx.gallery_photos.delete({ where: { id } });
			await tx.gallery_photos.updateMany({
				where: { year: row.year, position: { gt: row.position } },
				data: { position: { decrement: 1 } },
			});

			await maybeDeleteLocalFile(row.src);
			return true;
		});
	}

	async reorderPhotos(year: number, orderedIds: number[]): Promise<void> {
		const ids = orderedIds.map(Number).filter((n) => Number.isFinite(n));
		if (ids.length === 0) return;
		await this.prisma.$transaction(async (tx) => {
			const existing = await tx.gallery_photos.findMany({
				where: { year, id: { in: ids } },
				select: { id: true },
			});
			if (existing.length !== ids.length) throw new Error('Некоторые фото не найдены');

			for (const id of ids) {
				await tx.gallery_photos.update({ where: { id }, data: { position: -id } });
			}
			for (let i = 0; i < ids.length; i++) {
				await tx.gallery_photos.update({ where: { id: ids[i] }, data: { position: i + 1 } });
			}
		});
	}

	async createVideo(data: {
		src?: string;
		title?: string;
		description?: string;
		tags?: string[];
		duration?: string | null;
		is_external?: boolean;
		position?: number;
	}): Promise<GalleryVideoRow> {
		const src = (data.src ?? '').trim();
		const title = (data.title ?? '').trim();
		const description = (data.description ?? '').trim();
		const tags = Array.isArray(data.tags) ? data.tags.map((t) => t.trim()).filter(Boolean) : [];
		const duration = data.duration ?? null;
		const is_external = Boolean(data.is_external);
		if (!src) throw new HttpError(400, 'src обязателен');
		if (!title) throw new HttpError(400, 'title обязателен');

		return this.prisma.$transaction(async (tx) => {
			const count = await tx.gallery_videos.count();
			const insertPos =
				data.position !== undefined
					? Math.max(1, Math.min(Number(data.position), count + 1))
					: count + 1;
			await tx.gallery_videos.updateMany({
				where: { position: { gte: insertPos } },
				data: { position: { increment: 1 } },
			});
			const row = await tx.gallery_videos.create({
				data: { src, title, description, tags, duration, is_external, position: insertPos },
			});
			return {
				id: row.id,
				src: row.src,
				title: row.title,
				description: row.description,
				tags: row.tags,
				duration: row.duration,
				is_external: row.is_external,
				position: row.position,
			};
		});
	}

	async updateVideo(
		id: number,
		data: {
			src?: string;
			title?: string;
			description?: string;
			tags?: string[];
			duration?: string | null;
			is_external?: boolean;
			position?: number;
		},
	): Promise<GalleryVideoRow | null> {
		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.gallery_videos.findUnique({ where: { id } });
			if (!existing) return null;

			if (data.position !== undefined && Number(data.position) !== existing.position) {
				const count = await tx.gallery_videos.count();
				const targetPos = Math.max(1, Math.min(Number(data.position), count));
				await tx.gallery_videos.update({ where: { id }, data: { position: -id } });
				if (targetPos > existing.position) {
					await tx.gallery_videos.updateMany({
						where: { position: { gt: existing.position, lte: targetPos } },
						data: { position: { decrement: 1 } },
					});
				} else {
					await tx.gallery_videos.updateMany({
						where: { position: { gte: targetPos, lt: existing.position } },
						data: { position: { increment: 1 } },
					});
				}
				await tx.gallery_videos.update({
					where: { id },
					data: { position: targetPos },
				});
			}

			const tags =
				data.tags !== undefined
					? data.tags.map((t) => t.trim()).filter(Boolean)
					: undefined;

			await tx.gallery_videos.update({
				where: { id },
				data: {
					src: data.src?.trim() ?? undefined,
					title: data.title?.trim() ?? undefined,
					description: data.description?.trim() ?? undefined,
					tags,
					duration: data.duration === undefined ? undefined : data.duration,
					is_external: data.is_external === undefined ? undefined : Boolean(data.is_external),
				},
			});

			const row = await tx.gallery_videos.findUniqueOrThrow({ where: { id } });
			return {
				id: row.id,
				src: row.src,
				title: row.title,
				description: row.description,
				tags: row.tags,
				duration: row.duration,
				is_external: row.is_external,
				position: row.position,
			};
		});
	}

	async deleteVideo(id: number): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const row = await tx.gallery_videos.findUnique({ where: { id } });
			if (!row) return false;
			await tx.gallery_videos.delete({ where: { id } });
			await tx.gallery_videos.updateMany({
				where: { position: { gt: row.position } },
				data: { position: { decrement: 1 } },
			});
			if (!row.is_external) {
				await maybeDeleteLocalFile(row.src);
			}
			return true;
		});
	}

	async reorderVideos(orderedIds: number[]): Promise<void> {
		const ids = orderedIds.map(Number).filter((n) => Number.isFinite(n));
		if (ids.length === 0) return;
		await this.prisma.$transaction(async (tx) => {
			const existing = await tx.gallery_videos.findMany({
				where: { id: { in: ids } },
				select: { id: true },
			});
			if (existing.length !== ids.length) throw new Error('Некоторые видео не найдены');

			for (const id of ids) {
				await tx.gallery_videos.update({ where: { id }, data: { position: -id } });
			}
			for (let i = 0; i < ids.length; i++) {
				await tx.gallery_videos.update({ where: { id: ids[i] }, data: { position: i + 1 } });
			}
		});
	}
}

async function maybeDeleteLocalFile(src: string): Promise<void> {
	const v = src.trim();
	if (!v) return;
	const rel = v.startsWith('/images/') ? v.slice('/images/'.length) : '';
	if (!rel) return;
	const abs = path.join(process.cwd(), 'public', 'images', rel);
	try {
		await fs.unlink(abs);
	} catch {
		// ignore
	}
}

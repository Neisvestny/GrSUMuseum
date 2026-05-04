import type { PrismaClient } from '../generated/prisma/client.js';
import type { GalleryPhotoRow, GalleryVideoRow } from '../types';

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
}

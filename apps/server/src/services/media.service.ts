import type { Prisma, PrismaClient } from '../generated/prisma/client.js';
import fs from 'fs/promises';
import path from 'path';
import {
	guessMimeFromName,
	isImageMime,
	isVideoMime,
	externalLinkRelPath,
	guessExternalMime,
	parseExternalLinkRelPath,
	type MediaRoot,
	normalizeRel,
	physicalRoot,
	publicUrl,
	srcVariants,
	type StorageEntry,
} from '../lib/media-storage.js';
import { StatusCodes } from 'http-status-codes';
import { ApiMessage } from '../shared/api-messages.js';
import { HttpError } from '../shared/errors.js';

export interface MediaAssetDto {
	id: number;
	src: string;
	mimeType: string;
	title: string | null;
	alt: string | null;
	width: number | null;
	height: number | null;
	metadata: Record<string, unknown> | null;
	showInPhotoGallery: boolean;
	showInVideoGallery: boolean;
}

export interface BrowseFileAsset {
	id: number;
	title: string | null;
	alt: string | null;
	mimeType: string;
	showInPhotoGallery: boolean;
	showInVideoGallery: boolean;
	year: number | null;
	annotation: string;
	description: string;
	tags: string[];
	duration: string | null;
	is_external: boolean;
}

export interface BrowseEntryDto extends StorageEntry {
	url?: string;
	asset?: BrowseFileAsset | null;
}

export interface GalleryPhotoDto {
	id: number;
	src: string;
	title: string;
	annotation: string;
	year: number;
	position: number;
}

export interface GalleryVideoDto {
	id: number;
	src: string;
	title: string;
	description: string;
	tags: string[];
	duration: string | null;
	is_external: boolean;
	position: number;
}

export interface AssetMetadataPatch {
	title?: string;
	alt?: string;
	showInPhotoGallery?: boolean;
	showInVideoGallery?: boolean;
	year?: number;
	annotation?: string;
	description?: string;
	tags?: string[];
	duration?: string | null;
	is_external?: boolean;
	src?: string;
}

export interface RegisterLinkInput {
	src: string;
	root?: MediaRoot;
	title?: string;
	showInPhotoGallery?: boolean;
	showInVideoGallery?: boolean;
	description?: string;
	tags?: string[];
	duration?: string | null;
	is_external?: boolean;
	year?: number;
	annotation?: string;
}

function parseMetadata(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
	if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value))
		return {};
	return value as Record<string, unknown>;
}

function metaBool(meta: Record<string, unknown>, key: string): boolean | undefined {
	if (meta[key] === true) return true;
	if (meta[key] === false) return false;
	return undefined;
}

function defaultGalleryFlags(
	root: MediaRoot,
	mimeType: string,
): { showInPhotoGallery: boolean; showInVideoGallery: boolean } {
	if (isImageMime(mimeType)) {
		return { showInPhotoGallery: root === 'images', showInVideoGallery: false };
	}
	if (isVideoMime(mimeType)) {
		return { showInPhotoGallery: false, showInVideoGallery: root === 'videos' };
	}
	return { showInPhotoGallery: false, showInVideoGallery: false };
}

function assetFromRow(row: {
	id: number;
	src: string;
	mimeType: string;
	title: string | null;
	alt: string | null;
	width: number | null;
	height: number | null;
	metadata: Prisma.JsonValue;
}): MediaAssetDto {
	const meta = parseMetadata(row.metadata);
	const flags = defaultGalleryFlags(
		(typeof meta.root === 'string' ? meta.root : 'files') as MediaRoot,
		row.mimeType,
	);
	const showPhoto = metaBool(meta, 'showInPhotoGallery') ?? flags.showInPhotoGallery;
	const showVideo = metaBool(meta, 'showInVideoGallery') ?? flags.showInVideoGallery;
	return {
		id: row.id,
		src: row.src,
		mimeType: row.mimeType,
		title: row.title,
		alt: row.alt,
		width: row.width,
		height: row.height,
		metadata: meta,
		showInPhotoGallery: showPhoto,
		showInVideoGallery: showVideo,
	};
}

function browseAssetFromRow(row: {
	id: number;
	src: string;
	mimeType: string;
	title: string | null;
	alt?: string | null;
	metadata: Prisma.JsonValue;
}): BrowseFileAsset {
	const dto = assetFromRow({
		...row,
		alt: row.alt ?? null,
		width: null,
		height: null,
	});
	const meta = dto.metadata ?? {};
	return {
		id: dto.id,
		title: dto.title,
		alt: dto.alt,
		mimeType: dto.mimeType,
		showInPhotoGallery: dto.showInPhotoGallery,
		showInVideoGallery: dto.showInVideoGallery,
		year: typeof meta.year === 'number' ? meta.year : null,
		annotation: typeof meta.annotation === 'string' ? meta.annotation : '',
		description: typeof meta.description === 'string' ? meta.description : '',
		tags: Array.isArray(meta.tags)
			? (meta.tags as unknown[]).filter((t): t is string => typeof t === 'string')
			: [],
		duration:
			typeof meta.duration === 'string'
				? meta.duration
				: typeof meta.duration === 'number'
					? String(meta.duration)
					: null,
		is_external: Boolean(meta.is_external),
	};
}

function includesInPhotoGallery(row: {
	mimeType: string;
	metadata: Prisma.JsonValue;
}): boolean {
	const meta = parseMetadata(row.metadata);
	const explicit = metaBool(meta, 'showInPhotoGallery');
	if (explicit === true) return true;
	if (explicit === false) return false;
	if (!isImageMime(row.mimeType)) return false;
	// legacy: images with year were included in the photo gallery
	return typeof meta.year === 'number';
}

function includesInVideoGallery(row: {
	mimeType: string;
	metadata: Prisma.JsonValue;
}): boolean {
	const meta = parseMetadata(row.metadata);
	const explicit = metaBool(meta, 'showInVideoGallery');
	if (explicit === true) return true;
	if (explicit === false) return false;
	if (!isVideoMime(row.mimeType)) return false;
	return Boolean(meta.is_external) || typeof meta.description === 'string';
}

export class MediaService {
	constructor(private prisma: PrismaClient) {}

	async findAssetBySrc(src: string) {
		const trimmed = src.trim();
		const variants = new Set<string>([trimmed]);
		if (trimmed.startsWith('/images/')) variants.add(trimmed.slice(1));
		return this.prisma.mediaAsset.findFirst({
			where: {
				deletedAt: null,
				src: { in: [...variants] },
			},
		});
	}

	async upsertFromStorage(
		root: MediaRoot,
		relPath: string,
		opts?: { title?: string },
	): Promise<MediaAssetDto> {
		const cleaned = normalizeRel(relPath);
		const url = publicUrl(root, cleaned);
		const mimeType = guessMimeFromName(cleaned);
		const defaults = defaultGalleryFlags(root, mimeType);

		const existing = await this.findAssetBySrc(url);
		const prevMeta = existing ? parseMetadata(existing.metadata) : {};

		const metadata: Record<string, unknown> = {
			...prevMeta,
			root,
			relPath: cleaned,
			showInPhotoGallery:
				metaBool(prevMeta, 'showInPhotoGallery') ?? defaults.showInPhotoGallery,
			showInVideoGallery:
				metaBool(prevMeta, 'showInVideoGallery') ?? defaults.showInVideoGallery,
		};

		const title =
			opts?.title?.trim() ||
			existing?.title ||
			path.basename(cleaned) ||
			cleaned;

		const row = existing
			? await this.prisma.mediaAsset.update({
					where: { id: existing.id },
					data: {
						src: url,
						mimeType,
						title,
						metadata: metadata as Prisma.InputJsonValue,
						deletedAt: null,
					},
				})
			: await this.prisma.mediaAsset.create({
					data: {
						src: url,
						mimeType,
						title,
						metadata: metadata as Prisma.InputJsonValue,
					},
				});

		return assetFromRow(row);
	}

	async registerLink(input: RegisterLinkInput): Promise<MediaAssetDto> {
		const src = input.src.trim();
		if (!src) throw new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.SRC_REQUIRED);

		const rootHint = input.root;
		const mimeType = input.is_external
			? guessExternalMime(src, rootHint ?? 'files')
			: guessMimeFromName(src);
		const root: MediaRoot =
			rootHint ??
			(isVideoMime(mimeType) ? 'videos' : isImageMime(mimeType) ? 'images' : 'files');
		const defaults = defaultGalleryFlags(root, mimeType);

		const metadata: Record<string, unknown> = {
			root,
			relPath: '',
			is_external: Boolean(input.is_external ?? /^https?:\/\//i.test(src)),
			showInPhotoGallery: input.showInPhotoGallery ?? defaults.showInPhotoGallery,
			showInVideoGallery: input.showInVideoGallery ?? defaults.showInVideoGallery,
			description: (input.description ?? '').trim(),
			tags: input.tags ?? [],
			duration: input.duration ?? null,
			year: input.year,
			annotation: (input.annotation ?? '').trim(),
		};

		const existing = await this.findAssetBySrc(src);
		const row = existing
			? await this.prisma.mediaAsset.update({
					where: { id: existing.id },
					data: {
						src,
						mimeType,
						title: input.title?.trim() || existing.title,
						metadata: metadata as Prisma.InputJsonValue,
						deletedAt: null,
					},
				})
			: await this.prisma.mediaAsset.create({
					data: {
						src,
						mimeType,
						title: input.title?.trim() || src,
						metadata: metadata as Prisma.InputJsonValue,
					},
				});

		return assetFromRow(row);
	}

	async updateAssetMetadata(
		id: number,
		patch: AssetMetadataPatch,
	): Promise<MediaAssetDto | null> {
		const existing = await this.prisma.mediaAsset.findFirst({
			where: { id, deletedAt: null },
		});
		if (!existing) return null;

		const meta = parseMetadata(existing.metadata);
		if (patch.showInPhotoGallery !== undefined)
			meta.showInPhotoGallery = patch.showInPhotoGallery;
		if (patch.showInVideoGallery !== undefined)
			meta.showInVideoGallery = patch.showInVideoGallery;
		if (patch.year !== undefined) meta.year = patch.year;
		if (patch.annotation !== undefined) meta.annotation = patch.annotation.trim();
		if (patch.description !== undefined) meta.description = patch.description.trim();
		if (patch.tags !== undefined) meta.tags = patch.tags;
		if (patch.duration !== undefined) meta.duration = patch.duration;
		if (patch.is_external !== undefined) meta.is_external = patch.is_external;

		const row = await this.prisma.mediaAsset.update({
			where: { id },
			data: {
				...(patch.title !== undefined ? { title: patch.title.trim() || null } : {}),
				...(patch.alt !== undefined ? { alt: patch.alt.trim() || null } : {}),
				...(patch.src !== undefined ? { src: patch.src.trim() } : {}),
				metadata: meta as Prisma.InputJsonValue,
			},
		});
		return assetFromRow(row);
	}

	async browse(root: MediaRoot, relDir: string): Promise<BrowseEntryDto[]> {
		const { listDir } = await import('../lib/media-storage.js');
		const normalizedDir = normalizeRel(relDir);
		const entries = await listDir(root, normalizedDir);
		const out: BrowseEntryDto[] = [];

		for (const entry of entries) {
			if (entry.kind === 'dir') {
				out.push({ ...entry });
				continue;
			}
			const url = publicUrl(root, entry.relPath);
			const asset = await this.upsertFromStorage(root, entry.relPath);
			out.push({
				...entry,
				url,
				asset: browseAssetFromRow({
					id: asset.id,
					src: asset.src,
					mimeType: asset.mimeType,
					title: asset.title,
					alt: asset.alt,
					metadata: asset.metadata as Prisma.JsonValue,
				}),
			});
		}

		if (!normalizedDir) {
			const externalRows = await this.prisma.mediaAsset.findMany({
				where: { deletedAt: null },
				orderBy: { id: 'desc' },
			});
			for (const row of externalRows) {
				const meta = parseMetadata(row.metadata);
				if (!meta.is_external || meta.root !== root) continue;
				const displayName =
					row.title?.trim() ||
					(row.src.length > 64 ? `${row.src.slice(0, 61)}…` : row.src);
				out.push({
					name: displayName,
					kind: 'file',
					relPath: externalLinkRelPath(row.id),
					url: row.src,
					asset: browseAssetFromRow(row),
				});
			}
		}

		return out;
	}

	async searchFiles(root: MediaRoot, query: string, limit = 24): Promise<
		Array<{ name: string; url: string; assetId: number }>
	> {
		const q = query.trim().toLowerCase();
		const { listDir } = await import('../lib/media-storage.js');

		const walk = async (
			rel: string,
		): Promise<Array<{ name: string; url: string; assetId: number }>> => {
			const entries = await listDir(root, rel);
			const found: Array<{ name: string; url: string; assetId: number }> = [];
			for (const e of entries) {
				if (e.kind === 'dir') {
					found.push(...(await walk(e.relPath)));
					continue;
				}
				if (q && !e.name.toLowerCase().includes(q)) continue;
				const asset = await this.upsertFromStorage(root, e.relPath);
				found.push({ name: e.name, url: publicUrl(root, e.relPath), assetId: asset.id });
			}
			return found;
		};

		const all = await walk('');
		return all.slice(0, limit);
	}

	async softDeleteAssetsForPath(root: MediaRoot, relPath: string): Promise<void> {
		const cleaned = normalizeRel(relPath);
		const variants = srcVariants(root, cleaned);
		const prefix = publicUrl(root, cleaned);
		const urlPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

		await this.prisma.mediaAsset.updateMany({
			where: {
				deletedAt: null,
				OR: [{ src: { in: variants } }, { src: { startsWith: urlPrefix } }],
			},
			data: { deletedAt: new Date() },
		});
	}

	async renameAssetSrc(root: MediaRoot, oldRel: string, newRel: string): Promise<void> {
		const oldUrl = publicUrl(root, oldRel);
		const newUrl = publicUrl(root, newRel);
		const row = await this.findAssetBySrc(oldUrl);
		if (!row) return;
		const meta = parseMetadata(row.metadata);
		meta.relPath = normalizeRel(newRel);
		meta.root = root;
		await this.prisma.mediaAsset.update({
			where: { id: row.id },
			data: { src: newUrl, metadata: meta as Prisma.InputJsonValue },
		});
	}

	async getPhotos(): Promise<GalleryPhotoDto[]> {
		const rows = await this.prisma.mediaAsset.findMany({
			where: { deletedAt: null },
			orderBy: { id: 'asc' },
		});
		const filtered = rows.filter(includesInPhotoGallery);

		const byYear = new Map<number, typeof filtered>();
		for (const row of filtered) {
			const meta = parseMetadata(row.metadata);
			const year = typeof meta.year === 'number' ? meta.year : 0;
			const list = byYear.get(year) ?? [];
			list.push(row);
			byYear.set(year, list);
		}

		const out: GalleryPhotoDto[] = [];
		const years = [...byYear.keys()].sort((a, b) => a - b);
		for (const year of years) {
			const photos = byYear.get(year) ?? [];
			photos
				.sort((a, b) => {
					const pa = parseMetadata(a.metadata).position;
					const pb = parseMetadata(b.metadata).position;
					return (typeof pa === 'number' ? pa : a.id) - (typeof pb === 'number' ? pb : b.id);
				})
				.forEach((row, index) => {
					const meta = parseMetadata(row.metadata);
					out.push({
						id: row.id,
						src: row.src,
						title: row.title ?? '',
						annotation: typeof meta.annotation === 'string' ? meta.annotation : '',
						year,
						position: index + 1,
					});
				});
		}
		return out;
	}

	async getVideos(): Promise<GalleryVideoDto[]> {
		const rows = await this.prisma.mediaAsset.findMany({
			where: { deletedAt: null },
			orderBy: { id: 'asc' },
		});

		return rows
			.filter(includesInVideoGallery)
			.map((row, index) => {
				const meta = parseMetadata(row.metadata);
				const tags = Array.isArray(meta.tags)
					? (meta.tags as unknown[]).filter((t): t is string => typeof t === 'string')
					: [];
				return {
					id: row.id,
					src: row.src,
					title: row.title ?? '',
					description: typeof meta.description === 'string' ? meta.description : '',
					tags,
					duration:
						typeof meta.duration === 'string'
							? meta.duration
							: typeof meta.duration === 'number'
								? String(meta.duration)
								: null,
					is_external: Boolean(meta.is_external),
					position:
						typeof meta.position === 'number' ? meta.position : index + 1,
				};
			})
			.sort((a, b) => a.position - b.position);
	}

	async updatePhoto(
		id: number,
		data: {
			src?: string;
			title?: string;
			annotation?: string;
			year?: number;
			showInPhotoGallery?: boolean;
		},
	): Promise<GalleryPhotoDto | null> {
		await this.updateAssetMetadata(id, {
			title: data.title,
			annotation: data.annotation,
			year: data.year,
			showInPhotoGallery: data.showInPhotoGallery ?? true,
		});
		if (data.src) {
			await this.prisma.mediaAsset.update({
				where: { id },
				data: { src: data.src.trim() },
			});
		}
		const photos = await this.getPhotos();
		return photos.find((p) => p.id === id) ?? null;
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
			showInVideoGallery?: boolean;
		},
	): Promise<GalleryVideoDto | null> {
		await this.updateAssetMetadata(id, {
			title: data.title,
			description: data.description,
			tags: data.tags,
			duration: data.duration,
			is_external: data.is_external,
			showInVideoGallery: data.showInVideoGallery ?? true,
		});
		if (data.src) {
			await this.prisma.mediaAsset.update({
				where: { id },
				data: { src: data.src.trim() },
			});
		}
		const videos = await this.getVideos();
		return videos.find((v) => v.id === id) ?? null;
	}

	async deletePhoto(id: number): Promise<boolean> {
		return this.softDeleteAsset(id);
	}

	async deleteVideo(id: number): Promise<boolean> {
		return this.softDeleteAsset(id);
	}

	async softDeleteAsset(id: number): Promise<boolean> {
		const row = await this.prisma.mediaAsset.findFirst({ where: { id, deletedAt: null } });
		if (!row) return false;
		await this.prisma.mediaAsset.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
		const meta = parseMetadata(row.metadata);
		if (!meta.is_external) {
			await maybeDeleteLocalFile(row.src);
		}
		return true;
	}

	async reorderPhotos(year: number, orderedIds: number[]): Promise<void> {
		for (let i = 0; i < orderedIds.length; i++) {
			const row = await this.prisma.mediaAsset.findFirst({
				where: { id: orderedIds[i], deletedAt: null },
			});
			if (!row) continue;
			const meta = parseMetadata(row.metadata);
			meta.year = year;
			meta.position = i + 1;
			meta.showInPhotoGallery = true;
			await this.prisma.mediaAsset.update({
				where: { id: row.id },
				data: { metadata: meta as Prisma.InputJsonValue },
			});
		}
	}

	async reorderVideos(orderedIds: number[]): Promise<void> {
		for (let i = 0; i < orderedIds.length; i++) {
			const row = await this.prisma.mediaAsset.findFirst({
				where: { id: orderedIds[i], deletedAt: null },
			});
			if (!row) continue;
			const meta = parseMetadata(row.metadata);
			meta.position = i + 1;
			meta.showInVideoGallery = true;
			await this.prisma.mediaAsset.update({
				where: { id: row.id },
				data: { metadata: meta as Prisma.InputJsonValue },
			});
		}
	}
}

async function maybeDeleteLocalFile(src: string): Promise<void> {
	const v = src.trim();
	if (!v || /^https?:\/\//i.test(v)) return;
	const match = v.match(/^\/(images|videos|files)\/(.+)$/);
	if (!match) return;
	const [, root, rel] = match;
	const abs = path.join(physicalRoot(root as MediaRoot), rel);
	try {
		await fs.unlink(abs);
	} catch {
		// ignore
	}
}

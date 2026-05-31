import fs from 'fs/promises';
import path from 'path';
import { StatusCodes } from 'http-status-codes';
import { decodeUploadFilename } from '../lib/decode-upload-filename.js';
import { fetchYoutubeMeta } from '../lib/remote-video-meta.js';
import {
	isMediaRoot,
	normalizeRel,
	publicUrl,
	resolveInsideRoot,
	uniqueTargetPath,
	parseExternalLinkRelPath,
	type MediaRoot,
} from '../lib/media-storage.js';
import { ApiMessage } from '../shared/api-messages.js';
import { HttpError } from '../shared/errors.js';
import {
	requireNonEmptyString,
	requireSafePathSegment,
} from '../shared/validate-path-segment.js';
import type { MediaService } from './media.service.js';

export interface UploadFileInput {
	originalName: string;
	buffer: Buffer;
}

export interface SavedUploadFile {
	name: string;
	relPath: string;
	url: string;
	assetId: number;
}

export interface UploadUrlResult {
	name: string;
	relPath: string;
	url: string;
	assetId: number;
	external?: boolean;
}

export class MediaStorageService {
	constructor(private media: MediaService) {}

	async mkdir(root: MediaRoot, dir: string, name: string): Promise<void> {
		const safeName = requireSafePathSegment(name, ApiMessage.NAME_REQUIRED);
		const rel = dir ? `${dir}/${safeName}` : safeName;
		await fs.mkdir(resolveInsideRoot(root, rel), { recursive: false });
	}

	async rename(root: MediaRoot, relPath: string, newName: string): Promise<string> {
		if (parseExternalLinkRelPath(relPath) !== null) {
			throw new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.EXTERNAL_LINK_IMMUTABLE);
		}
		const cleanedPath = requireNonEmptyString(relPath, ApiMessage.PATH_REQUIRED);
		const safeName = requireSafePathSegment(newName, ApiMessage.NEW_NAME_REQUIRED);
		const normalizedPath = normalizeRel(cleanedPath);

		const parentRel = normalizedPath.split('/').slice(0, -1).join('/');
		const targetRel = parentRel ? `${parentRel}/${safeName}` : safeName;

		await fs.rename(
			resolveInsideRoot(root, normalizedPath),
			resolveInsideRoot(root, targetRel),
		);
		await this.media.renameAssetSrc(root, normalizedPath, targetRel);

		return targetRel;
	}

	async move(
		root: MediaRoot,
		relPath: string,
		toDir: string,
		newName?: string,
	): Promise<string> {
		if (parseExternalLinkRelPath(relPath) !== null) {
			throw new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.EXTERNAL_LINK_IMMUTABLE);
		}
		const cleanedPath = requireNonEmptyString(relPath, ApiMessage.PATH_REQUIRED);
		const normalizedPath = normalizeRel(cleanedPath);
		const normalizedToDir = normalizeRel(toDir);

		const name =
			(typeof newName === 'string' && newName.trim()) ||
			normalizedPath.split('/').at(-1) ||
			'';
		if (!name) {
			throw new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.INVALID_NAME);
		}

		const targetRel = normalizedToDir ? `${normalizedToDir}/${name}` : name;
		await fs.mkdir(resolveInsideRoot(root, normalizedToDir), { recursive: true });
		await fs.rename(
			resolveInsideRoot(root, normalizedPath),
			resolveInsideRoot(root, targetRel),
		);
		await this.media.renameAssetSrc(root, normalizedPath, targetRel);

		return targetRel;
	}

	async deleteItem(root: MediaRoot, relPath: string): Promise<void> {
		const linkId = parseExternalLinkRelPath(relPath);
		if (linkId !== null) {
			const ok = await this.media.softDeleteAsset(linkId);
			if (!ok) {
				throw new HttpError(StatusCodes.NOT_FOUND, ApiMessage.NOT_FOUND);
			}
			return;
		}

		const cleanedPath = requireNonEmptyString(relPath, ApiMessage.PATH_REQUIRED);
		const normalizedPath = normalizeRel(cleanedPath);

		const abs = resolveInsideRoot(root, normalizedPath);
		const st = await fs.stat(abs).catch(() => null);
		if (!st) {
			throw new HttpError(StatusCodes.NOT_FOUND, ApiMessage.NOT_FOUND);
		}

		await this.media.softDeleteAssetsForPath(root, normalizedPath);

		if (st.isDirectory()) {
			await fs.rm(abs, { recursive: true, force: true });
		} else {
			await fs.unlink(abs);
		}
	}

	async uploadFiles(
		root: MediaRoot,
		dir: string,
		files: UploadFileInput[],
	): Promise<SavedUploadFile[]> {
		if (!files.length) {
			throw new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.FILES_REQUIRED);
		}

		const normalizedDir = normalizeRel(dir);
		const absDir = resolveInsideRoot(root, normalizedDir);
		await fs.mkdir(absDir, { recursive: true });

		const saved: SavedUploadFile[] = [];
		for (const file of files) {
			const fileName = decodeUploadFilename(file.originalName);
			const targetAbs = await uniqueTargetPath(absDir, fileName);
			await fs.writeFile(targetAbs, file.buffer);
			const name = path.basename(targetAbs);
			const relPath = normalizedDir ? `${normalizedDir}/${name}` : name;
			const asset = await this.media.upsertFromStorage(root, relPath);
			saved.push({
				name,
				relPath,
				url: publicUrl(root, relPath),
				assetId: asset.id,
			});
		}

		return saved;
	}

	async uploadFromUrl(
		root: MediaRoot,
		dir: string,
		url: string,
		filename?: string,
	): Promise<UploadUrlResult> {
		const trimmedUrl = requireNonEmptyString(url, ApiMessage.URL_REQUIRED);

		if (/^https?:\/\//i.test(trimmedUrl)) {
			const meta = await fetchYoutubeMeta(trimmedUrl);
			const asset = await this.media.registerLink({
				src: trimmedUrl,
				root,
				title: filename?.trim() || meta?.title || trimmedUrl,
				duration: meta?.duration,
				is_external: true,
				showInPhotoGallery: root === 'images',
				showInVideoGallery: root === 'videos',
			});
			return {
				name: filename?.trim() || meta?.title || trimmedUrl,
				relPath: '',
				url: trimmedUrl,
				assetId: asset.id,
				external: true,
			};
		}

		const normalizedDir = normalizeRel(dir);
		const absDir = resolveInsideRoot(root, normalizedDir);
		await fs.mkdir(absDir, { recursive: true });

		const response = await fetch(trimmedUrl);
		if (!response.ok) {
			throw new HttpError(
				StatusCodes.BAD_REQUEST,
				ApiMessage.downloadFailed(response.status),
			);
		}
		const buf = Buffer.from(await response.arrayBuffer());

		let name = filename?.trim() ?? '';
		if (!name) {
			try {
				const parsed = new URL(trimmedUrl);
				name = decodeURIComponent(parsed.pathname.split('/').pop() || '').trim();
			} catch {
				name = '';
			}
		}
		if (!name) name = 'download';

		const targetAbs = await uniqueTargetPath(absDir, name);
		await fs.writeFile(targetAbs, buf);
		const savedName = path.basename(targetAbs);
		const relPath = normalizedDir ? `${normalizedDir}/${savedName}` : savedName;
		const asset = await this.media.upsertFromStorage(root, relPath);

		return {
			name: savedName,
			relPath,
			url: publicUrl(root, relPath),
			assetId: asset.id,
		};
	}

	static parseRoot(raw: unknown, fallback: MediaRoot = 'images'): MediaRoot {
		return isMediaRoot(raw) ? raw : fallback;
	}
}

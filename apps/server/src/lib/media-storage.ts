import fs from 'fs/promises';
import path from 'path';
import { StatusCodes } from 'http-status-codes';
import { ApiMessage } from '../shared/api-messages.js';
import { HttpError } from '../shared/errors.js';
import { physicalMediaRoot } from './paths.js';

export const MEDIA_ROOTS = ['images', 'videos', 'files'] as const;
export type MediaRoot = (typeof MEDIA_ROOTS)[number];

export function isMediaRoot(value: unknown): value is MediaRoot {
	return typeof value === 'string' && (MEDIA_ROOTS as readonly string[]).includes(value);
}

export function toPosix(p: string): string {
	return p.replace(/\\/g, '/');
}

export function normalizeRel(raw: unknown): string {
	const v = typeof raw === 'string' ? raw : '';
	return toPosix(v).trim().replace(/^\/+|\/+$/g, '');
}

export function physicalRoot(root: MediaRoot): string {
	return physicalMediaRoot(root);
}

export function publicBaseUrl(root: MediaRoot): string {
	return `/${root}/`;
}

export function publicUrl(root: MediaRoot, relPath: string): string {
	const cleaned = normalizeRel(relPath);
	return cleaned ? `/${root}/${cleaned}` : `/${root}/`;
}

export function resolveInsideRoot(root: MediaRoot, rel: string): string {
	const abs = path.resolve(physicalRoot(root), rel);
	const base = path.resolve(physicalRoot(root));
	const withSep = base.endsWith(path.sep) ? base : base + path.sep;
	if (abs !== base && !abs.startsWith(withSep)) {
		throw new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.INVALID_PATH);
	}
	return abs;
}

export async function ensureRootDirs(): Promise<void> {
	for (const root of MEDIA_ROOTS) {
		await fs.mkdir(physicalRoot(root), { recursive: true });
	}
}

export async function safeStat(absPath: string) {
	try {
		return await fs.stat(absPath);
	} catch {
		return null;
	}
}

export type StorageEntry = {
	name: string;
	kind: 'file' | 'dir';
	relPath: string;
	size?: number;
	mtimeMs?: number;
};

export async function listDir(root: MediaRoot, relDir: string): Promise<StorageEntry[]> {
	const absDir = resolveInsideRoot(root, relDir);
	await fs.mkdir(absDir, { recursive: true });
	const entries = await fs.readdir(absDir, { withFileTypes: true });

	const out: StorageEntry[] = [];
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

	out.sort((a, b) => {
		if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
		return a.name.localeCompare(b.name, 'ru');
	});
	return out;
}

export async function uniqueTargetPath(absDir: string, fileName: string): Promise<string> {
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

export function guessMimeFromName(nameOrSrc: string): string {
	const lower = nameOrSrc.toLowerCase();
	if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'video/youtube';
	if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) return 'video/mp4';
	if (lower.endsWith('.png')) return 'image/png';
	if (lower.endsWith('.webp')) return 'image/webp';
	if (lower.endsWith('.gif')) return 'image/gif';
	if (lower.endsWith('.svg')) return 'image/svg+xml';
	if (lower.endsWith('.pdf')) return 'application/pdf';
	if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'application/msword';
	return 'application/octet-stream';
}

export function isImageMime(mime: string): boolean {
	return mime.startsWith('image/');
}

export function isVideoMime(mime: string): boolean {
	return mime.startsWith('video/');
}

/** Virtual relPath prefix for external URL assets in browse listings. */
export const EXTERNAL_LINK_PREFIX = '__link__';

export function externalLinkRelPath(assetId: number): string {
	return `${EXTERNAL_LINK_PREFIX}/${assetId}`;
}

export function parseExternalLinkRelPath(relPath: string): number | null {
	const match = normalizeRel(relPath).match(/^__link__\/(\d+)$/);
	if (!match) return null;
	const id = Number(match[1]);
	return Number.isFinite(id) ? id : null;
}

export function guessExternalMime(src: string, root: MediaRoot): string {
	const fromName = guessMimeFromName(src);
	if (fromName !== 'application/octet-stream') return fromName;
	if (root === 'images') return 'image/jpeg';
	if (root === 'videos') return 'video/mp4';
	return 'application/octet-stream';
}

/** All src URL variants that may be stored for a media asset. */
export function srcVariants(root: MediaRoot, relPath: string): string[] {
	const cleaned = normalizeRel(relPath);
	const url = publicUrl(root, cleaned);
	return [url, cleaned, `/${cleaned}`, toPosix(url)];
}

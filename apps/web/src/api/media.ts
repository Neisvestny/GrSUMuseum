import { apiRequest } from '../shared/api/client';

export type MediaRoot = 'images' | 'videos' | 'files';

export type MediaBrowseAsset = {
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
};

export type MediaBrowseEntry = {
	name: string;
	kind: 'file' | 'dir';
	relPath: string;
	url?: string;
	size?: number;
	mtimeMs?: number;
	asset?: MediaBrowseAsset | null;
};

export type MediaBrowseResult = {
	root: MediaRoot;
	dir: string;
	baseUrl: string;
	entries: MediaBrowseEntry[];
};

export type AssetMetadataPatch = {
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
};

const API_BASE =
	(import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api';

export async function fetchMediaRoots(): Promise<
	Array<{ id: MediaRoot; baseUrl: string }>
> {
	const data = await apiRequest<{ roots: Array<{ id: MediaRoot; baseUrl: string }> }>(
		'/media/roots',
	);
	return data.roots;
}

export async function browseMedia(root: MediaRoot, dir = ''): Promise<MediaBrowseResult> {
	const params = new URLSearchParams({ root });
	if (dir.trim()) params.set('dir', dir.trim());
	return apiRequest<MediaBrowseResult>(`/media/browse?${params}`);
}

export async function searchMedia(
	root: MediaRoot,
	q: string,
): Promise<{ files: Array<{ name: string; url: string; assetId: number }> }> {
	const params = new URLSearchParams({ root, q });
	return apiRequest(`/media/search?${params}`);
}

export type RemoteVideoMeta = {
	title?: string;
	duration?: string;
};

export async function fetchRemoteVideoMeta(url: string): Promise<RemoteVideoMeta> {
	const params = new URLSearchParams({ url: url.trim() });
	return apiRequest<RemoteVideoMeta>(`/media/remote-meta?${params}`);
}

export async function mkdirMedia(root: MediaRoot, dir: string, name: string): Promise<void> {
	await apiRequest('/media/mkdir', {
		method: 'POST',
		body: JSON.stringify({ root, dir, name }),
	});
}

export async function renameMediaPath(
	root: MediaRoot,
	pathStr: string,
	newName: string,
): Promise<{ path: string }> {
	return apiRequest('/media/rename', {
		method: 'POST',
		body: JSON.stringify({ root, path: pathStr, newName }),
	});
}

export async function moveMediaPath(
	root: MediaRoot,
	pathStr: string,
	toDir: string,
	newName?: string,
): Promise<{ path: string }> {
	return apiRequest('/media/move', {
		method: 'POST',
		body: JSON.stringify({ root, path: pathStr, toDir, newName }),
	});
}

export async function deleteMediaPath(root: MediaRoot, pathStr: string): Promise<void> {
	const params = new URLSearchParams({ root, path: pathStr });
	await apiRequest(`/media/item?${params}`, { method: 'DELETE' });
}

export async function uploadMediaFiles(
	root: MediaRoot,
	dir: string,
	files: File[],
): Promise<{ files: Array<{ name: string; relPath: string; url: string; assetId: number }> }> {
	const form = new FormData();
	for (const f of files) form.append('files', f);

	const params = new URLSearchParams({ root });
	if (dir.trim()) params.set('dir', dir.trim());

	const response = await fetch(`${API_BASE}/media/upload?${params}`, {
		method: 'POST',
		credentials: 'include',
		body: form,
	});

	if (!response.ok) {
		let payload: unknown = null;
		try {
			payload = await response.json();
		} catch {
			payload = null;
		}
		const msg =
			typeof payload === 'object' &&
			payload !== null &&
			'error' in payload &&
			typeof (payload as { error?: unknown }).error === 'string'
				? (payload as { error: string }).error
				: `Upload failed (${response.status})`;
		throw new Error(msg);
	}

	return (await response.json()) as {
		files: Array<{ name: string; relPath: string; url: string; assetId: number }>;
	};
}

export async function uploadMediaByUrl(
	root: MediaRoot,
	dir: string,
	url: string,
	filename?: string,
): Promise<{ file?: { url: string; assetId: number }; external?: boolean }> {
	return apiRequest('/media/upload-url', {
		method: 'POST',
		body: JSON.stringify({ root, dir, url, filename }),
	});
}

export async function registerMediaLink(data: {
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
}): Promise<{ id: number; src: string }> {
	return apiRequest('/media/assets/link', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateMediaAsset(id: number, patch: AssetMetadataPatch): Promise<void> {
	await apiRequest(`/media/assets/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(patch),
	});
}

export function publicUrlFor(root: MediaRoot, relPath: string): string {
	const cleaned = relPath.replace(/^\/+|\/+$/g, '');
	return cleaned ? `/${root}/${cleaned}` : `/${root}/`;
}

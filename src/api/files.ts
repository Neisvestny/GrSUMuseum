import { apiRequest } from '../shared/api/client';

export type FileManagerEntry = {
	name: string;
	kind: 'file' | 'dir';
	relPath: string; // relative to /images, posix, no leading slash
	size?: number;
	mtimeMs?: number;
};

export type FilesIndex = {
	dir: string;
	baseUrl: string;
	entries: FileManagerEntry[];
};

export async function fetchFilesIndex(dir?: string): Promise<FilesIndex> {
	const d = dir?.trim() ?? '';
	const suffix = d ? `?dir=${encodeURIComponent(d)}` : '';
	return apiRequest<FilesIndex>(`/files${suffix}`);
}

export async function mkdir(dir: string, name: string): Promise<void> {
	await apiRequest(`/files/mkdir`, {
		method: 'POST',
		body: JSON.stringify({ dir, name }),
	});
}

export async function renamePath(path: string, newName: string): Promise<{ path: string }> {
	return apiRequest(`/files/rename`, {
		method: 'POST',
		body: JSON.stringify({ path, newName }),
	});
}

export async function movePath(
	pathStr: string,
	toDir: string,
	newName?: string,
): Promise<{ path: string }> {
	return apiRequest(`/files/move`, {
		method: 'POST',
		body: JSON.stringify({ path: pathStr, toDir, newName }),
	});
}

export async function deletePath(pathStr: string): Promise<void> {
	await apiRequest(`/files?path=${encodeURIComponent(pathStr)}`, { method: 'DELETE' });
}

export async function uploadFiles(
	dir: string,
	files: File[],
): Promise<{ files: Array<{ name: string; relPath: string; url: string }> }> {
	const form = new FormData();
	for (const f of files) form.append('files', f);

	const response = await fetch(
		`${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:3001/api'}/files/upload?dir=${encodeURIComponent(
			dir ?? '',
		)}`,
		{
			method: 'POST',
			body: form,
		},
	);

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

	return (await response.json()) as { files: Array<{ name: string; relPath: string; url: string }> };
}

export async function uploadByUrl(
	dir: string,
	url: string,
	filename?: string,
): Promise<{ file: { name: string; relPath: string; url: string } }> {
	return apiRequest(`/files/upload-url`, {
		method: 'POST',
		body: JSON.stringify({ dir, url, filename }),
	});
}


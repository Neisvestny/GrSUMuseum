import type { MediaRoot } from '../api/media';

export type PreviewKind = 'image' | 'video' | 'file';

export type FileTypeIcon = {
	icon: string;
	bgClass: string;
	label: string;
};

export function getYoutubeId(url: string): string | null {
	const match = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
	);
	return match ? match[1] : null;
}

export function getVimeoId(url: string): string | null {
	const match = url.match(/vimeo\.com\/(\d+)/);
	return match ? match[1] : null;
}

export function getVideoThumbnail(src: string): string | null {
	const ytId = getYoutubeId(src);
	if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
	const vimeoId = getVimeoId(src);
	if (vimeoId) return `https://vumbnail.com/${vimeoId}.jpg`;
	return null;
}

export function getFileExtension(fileName: string): string {
	const base = fileName.split('/').pop() ?? fileName;
	const dot = base.lastIndexOf('.');
	if (dot <= 0) return '';
	return base.slice(dot + 1).toLowerCase();
}

export function isExternalVideoUrl(url: string): boolean {
	return /^https?:\/\//i.test(url.trim()) && (Boolean(getYoutubeId(url)) || Boolean(getVimeoId(url)));
}

export function getPreviewKind(input: {
	root?: MediaRoot;
	url: string;
	mimeType?: string | null;
	fileName?: string;
}): PreviewKind {
	const mime = (input.mimeType ?? '').toLowerCase();
	const ext = getFileExtension(input.fileName ?? input.url);

	if (mime.startsWith('image/') || input.root === 'images') return 'image';
	if (
		mime.startsWith('video/') ||
		input.root === 'videos' ||
		isExternalVideoUrl(input.url) ||
		['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].includes(ext)
	) {
		return 'video';
	}
	return 'file';
}

const FILE_TYPE_MAP: Record<string, FileTypeIcon> = {
	pdf: { icon: '📕', bgClass: 'bg-red-100 text-red-800', label: 'PDF' },
	doc: { icon: '📝', bgClass: 'bg-blue-100 text-blue-800', label: 'DOC' },
	docx: { icon: '📝', bgClass: 'bg-blue-100 text-blue-800', label: 'DOCX' },
	xls: { icon: '📊', bgClass: 'bg-green-100 text-green-800', label: 'XLS' },
	xlsx: { icon: '📊', bgClass: 'bg-green-100 text-green-800', label: 'XLSX' },
	ppt: { icon: '📽️', bgClass: 'bg-orange-100 text-orange-800', label: 'PPT' },
	pptx: { icon: '📽️', bgClass: 'bg-orange-100 text-orange-800', label: 'PPTX' },
	zip: { icon: '🗜️', bgClass: 'bg-amber-100 text-amber-900', label: 'ZIP' },
	rar: { icon: '🗜️', bgClass: 'bg-amber-100 text-amber-900', label: 'RAR' },
	'7z': { icon: '🗜️', bgClass: 'bg-amber-100 text-amber-900', label: '7Z' },
	txt: { icon: '📄', bgClass: 'bg-gray-100 text-gray-700', label: 'TXT' },
};

const DEFAULT_FILE_ICON: FileTypeIcon = {
	icon: '📄',
	bgClass: 'bg-slate-100 text-slate-700',
	label: 'FILE',
};

export function getFileTypeIcon(ext: string): FileTypeIcon {
	const normalized = ext.toLowerCase();
	if (FILE_TYPE_MAP[normalized]) return FILE_TYPE_MAP[normalized];
	return {
		...DEFAULT_FILE_ICON,
		label: normalized ? normalized.toUpperCase() : 'FILE',
	};
}

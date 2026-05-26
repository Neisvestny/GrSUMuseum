/**
 * Encodes local public asset paths (/images/..., /videos/..., /files/...)
 * so non-ASCII filenames (e.g. Cyrillic) load reliably in <img src>.
 * External http(s) URLs are returned unchanged.
 */
export function resolvePublicAssetUrl(src: string | null | undefined): string {
	const trimmed = (src ?? '').trim();
	if (!trimmed) return '';
	if (/^https?:\/\//i.test(trimmed)) return trimmed;

	const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
	return path
		.split('/')
		.map((segment, index) => {
			if (index === 0 && segment === '') return '';
			if (!segment) return segment;
			try {
				return encodeURIComponent(decodeURIComponent(segment));
			} catch {
				return encodeURIComponent(segment);
			}
		})
		.join('/');
}

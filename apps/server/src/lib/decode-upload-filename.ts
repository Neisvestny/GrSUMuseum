/**
 * Multer/busboy often expose multipart filenames as Latin-1 strings whose
 * code units are UTF-8 bytes (mojibake for non-ASCII names, e.g. Russian).
 */
export function decodeUploadFilename(raw: string | undefined): string {
	const name = (raw ?? '').trim();
	if (!name) return 'file';

	if (/[\u0400-\u04FF]/.test(name)) return name;

	const decoded = Buffer.from(name, 'latin1').toString('utf8');
	if (decoded !== name && /[\u0400-\u04FF]/.test(decoded)) return decoded;

	return name;
}

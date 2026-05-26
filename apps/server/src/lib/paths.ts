import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** Monorepo root (`museum/`), stable regardless of `process.cwd()`. */
export const repoRoot = path.resolve(currentDir, '../../../..');

/** Uploaded media and Vite `public/` assets (`apps/web/public`). */
export const webPublicDir = path.join(repoRoot, 'apps/web/public');

/** Vite production build output (`apps/web/dist`). */
export const webDistDir = path.join(repoRoot, 'apps/web/dist');

/** Root `.env` at monorepo root. */
export const envFilePath = path.join(repoRoot, '.env');

export type MediaRootName = 'images' | 'videos' | 'files';

export function physicalMediaRoot(root: MediaRootName): string {
	return path.join(webPublicDir, root);
}

/** Directories scanned by image path autocomplete. */
export function imageSearchDirs(): string[] {
	return [
		path.join(webPublicDir, 'images'),
		path.join(webDistDir, 'images'),
		path.join(repoRoot, 'static', 'images'),
	];
}

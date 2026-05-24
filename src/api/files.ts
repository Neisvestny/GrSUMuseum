/** @deprecated Используйте `api/media.ts` */
import { browseMedia, type MediaBrowseEntry, type MediaRoot } from './media';

export type FileManagerEntry = MediaBrowseEntry;

export type FilesIndex = {
	dir: string;
	baseUrl: string;
	entries: FileManagerEntry[];
};

export async function fetchFilesIndex(dir?: string, root: MediaRoot = 'images'): Promise<FilesIndex> {
	const res = await browseMedia(root, dir ?? '');
	return { dir: res.dir, baseUrl: res.baseUrl, entries: res.entries };
}

export {
	deleteMediaPath as deletePath,
	mkdirMedia as mkdir,
	moveMediaPath as movePath,
	renameMediaPath as renamePath,
	uploadMediaByUrl as uploadByUrl,
	uploadMediaFiles as uploadFiles,
} from './media';

/** @deprecated Используйте `searchMedia` из `api/media.ts` */
import { searchMedia, type MediaRoot } from './media';

export async function fetchImagesIndex(q: string, root: MediaRoot = 'images') {
	const data = await searchMedia(root, q);
	return {
		files: data.files.map((f) => f.name),
		baseUrl: `/${root}/`,
	};
}

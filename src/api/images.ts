import { apiRequest } from '../shared/api/client';

export type ImagesIndex = {
	files: string[];
	baseUrl: string;
};

export async function fetchImagesIndex(query?: string): Promise<ImagesIndex> {
	const q = query?.trim();
	const suffix = q ? `?q=${encodeURIComponent(q)}` : '';
	return apiRequest<ImagesIndex>(`/images${suffix}`);
}

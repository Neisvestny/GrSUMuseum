import { apiRequest } from '../shared/api/client';

export interface GalleryPhoto {
	id: number;
	src: string;
	title: string;
	annotation: string;
	year: number;
	position: number;
}

export interface GalleryVideo {
	id: number;
	src: string;
	title: string;
	description: string;
	tags: string[];
	duration?: string | null;
	is_external?: boolean;
	position: number;
}

export async function fetchGalleryPhotos(): Promise<GalleryPhoto[]> {
	return apiRequest<GalleryPhoto[]>('/media/gallery/photos');
}

export async function fetchGalleryVideos(): Promise<GalleryVideo[]> {
	return apiRequest<GalleryVideo[]>('/media/gallery/videos');
}

export async function reorderGalleryPhotos(year: number, orderedIds: number[]): Promise<void> {
	await apiRequest<void>('/media/gallery/photos/reorder', {
		method: 'PATCH',
		body: JSON.stringify({ year, orderedIds }),
	});
}

export async function reorderGalleryVideos(orderedIds: number[]): Promise<void> {
	await apiRequest<void>('/media/gallery/videos/reorder', {
		method: 'PATCH',
		body: JSON.stringify({ orderedIds }),
	});
}

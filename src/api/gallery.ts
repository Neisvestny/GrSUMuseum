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
	return apiRequest<GalleryPhoto[]>('/gallery/photos');
}

export async function fetchGalleryVideos(): Promise<GalleryVideo[]> {
	return apiRequest<GalleryVideo[]>('/gallery/videos');
}

// admin: photos
export async function createGalleryPhoto(data: Partial<GalleryPhoto>): Promise<GalleryPhoto> {
	return apiRequest<GalleryPhoto>('/gallery/photos', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateGalleryPhoto(
	id: number,
	data: Partial<GalleryPhoto>,
): Promise<GalleryPhoto> {
	return apiRequest<GalleryPhoto>(`/gallery/photos/${id}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteGalleryPhoto(id: number): Promise<void> {
	await apiRequest<void>(`/gallery/photos/${id}`, { method: 'DELETE' });
}

export async function reorderGalleryPhotos(year: number, orderedIds: number[]): Promise<void> {
	await apiRequest<void>(`/gallery/photos/reorder`, {
		method: 'PATCH',
		body: JSON.stringify({ year, orderedIds }),
	});
}

// admin: videos
export async function createGalleryVideo(data: Partial<GalleryVideo>): Promise<GalleryVideo> {
	return apiRequest<GalleryVideo>('/gallery/videos', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateGalleryVideo(
	id: number,
	data: Partial<GalleryVideo>,
): Promise<GalleryVideo> {
	return apiRequest<GalleryVideo>(`/gallery/videos/${id}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteGalleryVideo(id: number): Promise<void> {
	await apiRequest<void>(`/gallery/videos/${id}`, { method: 'DELETE' });
}

export async function reorderGalleryVideos(orderedIds: number[]): Promise<void> {
	await apiRequest<void>(`/gallery/videos/reorder`, {
		method: 'PATCH',
		body: JSON.stringify({ orderedIds }),
	});
}

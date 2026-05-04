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

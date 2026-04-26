import { apiRequest } from '../shared/api/client';

export interface Rector {
	id: number;
	position: number;
	name: string;
	years: string;
	description: string;
	full_text: string;
	img: string;
	images: string[];
	files: { name: string; url: string }[];
}

export async function fetchRectors(): Promise<Rector[]> {
	return apiRequest<Rector[]>('/rectors');
}

export async function fetchRector(id: number): Promise<Rector> {
	return apiRequest<Rector>(`/rectors/${id}`);
}

export async function createRector(data: Partial<Rector>): Promise<Rector> {
	return apiRequest<Rector>('/rectors', {
		method: 'POST',
		body: JSON.stringify(sanitize(data)),
	});
}

export async function updateRector(id: number, data: Partial<Rector>): Promise<Rector> {
	return apiRequest<Rector>(`/rectors/${id}`, {
		method: 'PUT',
		body: JSON.stringify(sanitize(data)),
	});
}

export async function deleteRector(id: number): Promise<void> {
	await apiRequest<void>(`/rectors/${id}`, { method: 'DELETE' });
}

// Убираем пустые строки из массивов перед отправкой на сервер
function sanitize(data: Partial<Rector>): Partial<Rector> {
	return {
		...data,
		images: data.images?.filter((s) => s.trim() !== '') ?? [],
		files: data.files?.filter((f) => f.name.trim() !== '' || f.url.trim() !== '') ?? [],
	};
}

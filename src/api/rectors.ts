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

const BASE = 'http://localhost:3001/api/rectors';

export async function fetchRectors(): Promise<Rector[]> {
	const res = await fetch(BASE);
	if (!res.ok) throw new Error('Failed to fetch rectors');
	return res.json();
}

export async function fetchRector(id: number): Promise<Rector> {
	const res = await fetch(`${BASE}/${id}`);
	if (!res.ok) throw new Error('Failed to fetch rector');
	return res.json();
}

export async function createRector(data: Partial<Rector>): Promise<Rector> {
	const res = await fetch(BASE, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(sanitize(data)),
	});
	if (!res.ok) throw new Error('Failed to create rector');
	return res.json();
}

export async function updateRector(id: number, data: Partial<Rector>): Promise<Rector> {
	const res = await fetch(`${BASE}/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(sanitize(data)),
	});
	if (!res.ok) throw new Error('Failed to update rector');
	return res.json();
}

export async function deleteRector(id: number): Promise<void> {
	const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
	if (!res.ok) throw new Error('Failed to delete rector');
}

// Убираем пустые строки из массивов перед отправкой на сервер
function sanitize(data: Partial<Rector>): Partial<Rector> {
	return {
		...data,
		images: data.images?.filter((s) => s.trim() !== '') ?? [],
		files: data.files?.filter((f) => f.name.trim() !== '' || f.url.trim() !== '') ?? [],
	};
}

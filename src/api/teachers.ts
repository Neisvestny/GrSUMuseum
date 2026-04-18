export interface Teacher {
	id: number;
	name: string;
	role: string;
	desc: string;
	img: string;
}

const BASE = 'http://localhost:3001/api/teachers';

export async function fetchTeachers(
	section: 'vov' | 'afgan',
): Promise<Teacher[]> {
	const res = await fetch(`${BASE}/${section}`);
	if (!res.ok) throw new Error('Failed to fetch teachers');
	return res.json();
}

export async function createTeacher(
	section: 'vov' | 'afgan',
	data: Partial<Teacher> & { position?: number },
): Promise<Teacher> {
	const res = await fetch(`${BASE}/${section}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error('Failed to create teacher');
	return res.json();
}

export async function updateTeacher(
	section: 'vov' | 'afgan',
	position: number,
	data: Partial<Teacher> & { position?: number },
): Promise<Teacher> {
	const res = await fetch(`${BASE}/${section}/${position}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error('Failed to update teacher');
	return res.json();
}

export async function deleteTeacher(
	section: 'vov' | 'afgan',
	position: number,
): Promise<void> {
	const res = await fetch(`${BASE}/${section}/${position}`, {
		method: 'DELETE',
	});
	if (!res.ok) throw new Error('Failed to delete teacher');
}

export async function resetTeachers(
	section: 'vov' | 'afgan',
): Promise<Teacher[]> {
	const res = await fetch(`${BASE}/${section}/reset`, { method: 'POST' });
	if (!res.ok) throw new Error('Failed to reset teachers');
	return res.json();
}

import { apiRequest } from '../shared/api/client';

export interface Teacher {
	id: number;
	name: string;
	role: string;
	desc: string;
	img: string;
}

export type TeacherSection = 'vov' | 'afgan' | 'olympcoch' | 'olympstud' | 'trainer';
export type TeacherMutation = Partial<Omit<Teacher, 'id'>> & { position?: number };

export async function fetchTeachers(section: TeacherSection): Promise<Teacher[]> {
	return apiRequest<Teacher[]>(`/teachers/${section}`);
}

export async function createTeacher(
	section: TeacherSection,
	data: TeacherMutation,
): Promise<Teacher> {
	return apiRequest<Teacher>(`/teachers/${section}`, {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateTeacher(
	section: TeacherSection,
	position: number,
	data: TeacherMutation,
): Promise<Teacher> {
	return apiRequest<Teacher>(`/teachers/${section}/${position}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteTeacher(section: TeacherSection, position: number): Promise<void> {
	await apiRequest<void>(`/teachers/${section}/${position}`, {
		method: 'DELETE',
	});
}

export async function resetTeachers(section: TeacherSection): Promise<Teacher[]> {
	return apiRequest<Teacher[]>(`/teachers/${section}/reset`, { method: 'POST' });
}

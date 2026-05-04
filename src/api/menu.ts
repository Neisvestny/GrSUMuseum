import { apiRequest } from '../shared/api/client';

export interface MenuItem {
	id: number;
	section: string;
	position: number;
	label: string;
	path: string;
	is_active: boolean;
}

export interface MenuItemInput {
	section?: string;
	label?: string;
	path?: string;
	is_active?: boolean;
	position?: number;
}

export async function fetchMenuSection(section: string): Promise<MenuItem[]> {
	return apiRequest<MenuItem[]>(`/menu/${encodeURIComponent(section)}`);
}

export async function fetchMenuSectionAdmin(section: string): Promise<MenuItem[]> {
	return apiRequest<MenuItem[]>(`/menu/${encodeURIComponent(section)}?includeInactive=true`);
}

export async function fetchAllMenuItems(): Promise<MenuItem[]> {
	return apiRequest<MenuItem[]>('/menu');
}

export async function createMenuItem(data: MenuItemInput): Promise<MenuItem> {
	return apiRequest<MenuItem>('/menu', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateMenuItem(id: number, data: MenuItemInput): Promise<MenuItem> {
	return apiRequest<MenuItem>(`/menu/${id}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteMenuItem(id: number): Promise<void> {
	await apiRequest<void>(`/menu/${id}`, { method: 'DELETE' });
}

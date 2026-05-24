import { apiRequest } from '../shared/api/client';

export interface PersonFile {
	title: string;
	src: string;
}

export interface Person {
	id: number;
	lastName: string;
	firstName: string;
	patronymic: string | null;
	displayName: string;
	subtitle: string | null;
	yearFrom: number;
	yearTo: number | null;
	yearsLabel: string;
	shortDescription: string | null;
	fullDescription: string | null;
	img: string | null;
	sortOrder: number;
	roleSlugs: string[];
	tagSlugs: string[];
	categorySlugs: string[];
	images: string[];
	files: PersonFile[];
}

export interface TaxonomyItem {
	id: number;
	slug: string;
	label: string;
	sortOrder?: number;
}

export interface TaxonomyBundle {
	roles: TaxonomyItem[];
	tags: TaxonomyItem[];
	categories: TaxonomyItem[];
}

export type PersonMutation = {
	lastName?: string;
	firstName?: string;
	patronymic?: string | null;
	subtitle?: string | null;
	yearFrom?: number;
	yearTo?: number | null;
	shortDescription?: string | null;
	fullDescription?: string | null;
	img?: string | null;
	sortOrder?: number;
	roleSlugs?: string[];
	tagSlugs?: string[];
	categorySlugs?: string[];
	images?: string[];
	files?: Array<{ title?: string; url: string }>;
};

export type PeopleListFilters = {
	q?: string;
	role?: string;
	tag?: string;
	category?: string;
};

function toQuery(filters: PeopleListFilters): string {
	const params = new URLSearchParams();
	if (filters.q?.trim()) params.set('q', filters.q.trim());
	if (filters.role) params.set('role', filters.role);
	if (filters.tag) params.set('tag', filters.tag);
	if (filters.category) params.set('category', filters.category);
	const qs = params.toString();
	return qs ? `?${qs}` : '';
}

export async function fetchPeople(filters: PeopleListFilters = {}): Promise<Person[]> {
	return apiRequest<Person[]>(`/people${toQuery(filters)}`);
}

export async function fetchPerson(id: number): Promise<Person> {
	return apiRequest<Person>(`/people/${id}`);
}

export async function createPerson(data: PersonMutation): Promise<Person> {
	return apiRequest<Person>('/people', {
		method: 'POST',
		body: JSON.stringify(sanitize(data)),
	});
}

export async function updatePerson(id: number, data: PersonMutation): Promise<Person> {
	return apiRequest<Person>(`/people/${id}`, {
		method: 'PUT',
		body: JSON.stringify(sanitize(data)),
	});
}

export async function deletePerson(id: number): Promise<void> {
	await apiRequest<void>(`/people/${id}`, { method: 'DELETE' });
}

export async function reorderPeople(orderedIds: number[]): Promise<void> {
	await apiRequest<void>('/people/reorder', {
		method: 'PATCH',
		body: JSON.stringify({ orderedIds }),
	});
}

export async function fetchTaxonomy(): Promise<TaxonomyBundle> {
	return apiRequest<TaxonomyBundle>('/people/taxonomy');
}

export async function createRole(data: {
	slug: string;
	label: string;
	sortOrder?: number;
}): Promise<TaxonomyItem> {
	return apiRequest<TaxonomyItem>('/people/taxonomy/roles', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateRole(
	id: number,
	data: { slug?: string; label?: string; sortOrder?: number },
): Promise<TaxonomyItem> {
	return apiRequest<TaxonomyItem>(`/people/taxonomy/roles/${id}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteRole(id: number): Promise<void> {
	await apiRequest<void>(`/people/taxonomy/roles/${id}`, { method: 'DELETE' });
}

export async function createTag(data: { slug: string; label: string }): Promise<TaxonomyItem> {
	return apiRequest<TaxonomyItem>('/people/taxonomy/tags', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateTag(
	id: number,
	data: { slug?: string; label?: string },
): Promise<TaxonomyItem> {
	return apiRequest<TaxonomyItem>(`/people/taxonomy/tags/${id}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteTag(id: number): Promise<void> {
	await apiRequest<void>(`/people/taxonomy/tags/${id}`, { method: 'DELETE' });
}

export async function createCategory(data: { slug: string; label: string }): Promise<TaxonomyItem> {
	return apiRequest<TaxonomyItem>('/people/taxonomy/categories', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateCategory(
	id: number,
	data: { slug?: string; label?: string },
): Promise<TaxonomyItem> {
	return apiRequest<TaxonomyItem>(`/people/taxonomy/categories/${id}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteCategory(id: number): Promise<void> {
	await apiRequest<void>(`/people/taxonomy/categories/${id}`, { method: 'DELETE' });
}

function sanitize(data: PersonMutation): PersonMutation {
	return {
		...data,
		images: data.images?.filter((s) => s.trim() !== ''),
		files: data.files
			?.filter((f) => (f.title ?? '').trim() !== '' || f.url.trim() !== '')
			.map((f) => ({
				title: (f.title ?? 'Документ').trim(),
				url: f.url.trim(),
			})),
	};
}

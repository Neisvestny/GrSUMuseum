import { apiRequest } from '../shared/api/client';
import type { PageDocument } from '@museum/document';

export interface PageSummary {
	id: number;
	slug: string;
	title: string;
	themeKey: string;
	sidebarEnabled: boolean;
	hasPublished: boolean;
	documentVersion: number;
}

export interface PublicPage {
	id: number;
	slug: string;
	title: string;
	themeKey: string;
	sidebarEnabled: boolean;
	document: PageDocument;
}

export interface DraftPage extends PublicPage {
	documentVersion: number;
	draftDocument: PageDocument;
	publishedDocument: PageDocument | null;
}

export interface PageVersionSummary {
	id: number;
	pageId: number;
	createdAt: string;
	createdBy: string | null;
}

export interface PageVersionDetail extends PageVersionSummary {
	document: PageDocument;
}

export interface CreatePageInput {
	slug?: string;
	title?: string;
	themeKey?: string;
	sidebarEnabled?: boolean;
}

export interface UpdatePageMetaInput {
	slug?: string;
	title?: string;
	themeKey?: string;
	sidebarEnabled?: boolean;
}

export async function fetchPages(): Promise<PageSummary[]> {
	return apiRequest<PageSummary[]>('/pages');
}

export async function fetchPublicPageBySlug(slug: string): Promise<PublicPage> {
	return apiRequest<PublicPage>(`/pages/public/${encodeURIComponent(slug)}`);
}

export async function fetchPublicPageByPath(path: string): Promise<PublicPage> {
	return apiRequest<PublicPage>(`/pages/by-path?path=${encodeURIComponent(path)}`);
}

export async function fetchDraftPageBySlug(slug: string): Promise<DraftPage> {
	return apiRequest<DraftPage>(`/pages/${encodeURIComponent(slug)}/draft`);
}

export async function fetchPageById(id: number): Promise<DraftPage> {
	return apiRequest<DraftPage>(`/pages/by-id/${id}`);
}

export async function createPage(data: CreatePageInput): Promise<PageSummary> {
	return apiRequest<PageSummary>('/pages', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updatePageMeta(id: number, data: UpdatePageMetaInput): Promise<PageSummary> {
	return apiRequest<PageSummary>(`/pages/by-id/${id}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function autosaveDraft(
	slug: string,
	document: PageDocument,
	documentVersion: number,
): Promise<{ documentVersion: number }> {
	return apiRequest<{ documentVersion: number }>(`/pages/${encodeURIComponent(slug)}/draft`, {
		method: 'PATCH',
		body: JSON.stringify({ document, documentVersion }),
	});
}

export async function publishPage(slug: string): Promise<PublicPage> {
	return apiRequest<PublicPage>(`/pages/${encodeURIComponent(slug)}/publish`, {
		method: 'POST',
	});
}

export async function fetchPageVersions(slug: string): Promise<PageVersionSummary[]> {
	return apiRequest<PageVersionSummary[]>(`/pages/${encodeURIComponent(slug)}/versions`);
}

export async function fetchPageVersion(slug: string, versionId: number): Promise<PageVersionDetail> {
	return apiRequest<PageVersionDetail>(
		`/pages/${encodeURIComponent(slug)}/versions/${versionId}`,
	);
}

export async function restorePageVersion(slug: string, versionId: number): Promise<DraftPage> {
	return apiRequest<DraftPage>(
		`/pages/${encodeURIComponent(slug)}/versions/${versionId}/restore`,
		{ method: 'POST' },
	);
}

export async function deletePage(id: number): Promise<void> {
	await apiRequest<void>(`/pages/by-id/${id}`, { method: 'DELETE' });
}

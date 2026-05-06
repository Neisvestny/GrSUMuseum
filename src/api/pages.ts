import { apiRequest } from '../shared/api/client';

export interface PageSummary {
	id: number;
	slug: string;
	title: string;
	template: PageTemplate;
}

export type PageTemplate =
	| 'tabs_alternating'
	| 'alternating_blocks'
	| 'text_image'
	| 'tabs_text_image';

export const PAGE_TEMPLATES: Array<{ value: PageTemplate; label: string }> = [
	{ value: 'tabs_alternating', label: 'Табы + чередующиеся блоки' },
	{ value: 'alternating_blocks', label: 'Чередующиеся блоки (без вкладок)' },
	{ value: 'text_image', label: 'Текст + изображение' },
	{ value: 'tabs_text_image', label: 'Табы + текст/изображение' },
];

/** Шаблон только контента (без режима «с табами»). Для вкладки/блока: null = как у страницы по умолчанию. */
export type ContentTemplate = 'alternating_blocks' | 'text_image';

export const CONTENT_TEMPLATES: Array<{ value: ContentTemplate; label: string }> = [
	{ value: 'alternating_blocks', label: 'Чередующиеся блоки' },
	{ value: 'text_image', label: 'Текст + изображение' },
];

export interface PageParagraph {
	id: number;
	position: number;
	text: string;
}

export interface PageBlock {
	id: number;
	position: number;
	img: string | null;
	template: ContentTemplate | null;
	paragraphs: PageParagraph[];
}

export interface PageTab {
	id: number;
	position: number;
	label: string;
	template: ContentTemplate | null;
	blocks: PageBlock[];
}

export interface PageDto {
	id: number;
	slug: string;
	title: string;
	template: PageTemplate;
	tabs: PageTab[];
	blocks: PageBlock[];
}

export interface PageInput {
	slug?: string;
	title?: string;
	template?: PageTemplate;
}

export interface TabInput {
	label?: string;
	position?: number;
	template?: ContentTemplate | null;
}

export interface BlockInput {
	page_id?: number | null;
	tab_id?: number | null;
	img?: string | null;
	position?: number;
	template?: ContentTemplate | null;
}

export interface ParagraphInput {
	text?: string;
	position?: number;
}

export async function fetchPages(): Promise<PageSummary[]> {
	return apiRequest<PageSummary[]>('/pages');
}

export async function fetchPageBySlug(slug: string): Promise<PageDto> {
	return apiRequest<PageDto>(`/pages/by-slug/${encodeURIComponent(slug)}`);
}

export async function fetchPageByPath(path: string): Promise<PageDto> {
	return apiRequest<PageDto>(`/pages/by-path?path=${encodeURIComponent(path)}`);
}

export async function fetchPageById(id: number): Promise<PageDto> {
	return apiRequest<PageDto>(`/pages/${id}`);
}

export async function createPage(data: PageInput): Promise<PageSummary> {
	return apiRequest<PageSummary>('/pages', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updatePage(id: number, data: PageInput): Promise<PageSummary> {
	return apiRequest<PageSummary>(`/pages/${id}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deletePage(id: number): Promise<void> {
	await apiRequest<void>(`/pages/${id}`, { method: 'DELETE' });
}

export async function createTab(pageId: number, data: TabInput): Promise<PageTab> {
	return apiRequest<PageTab>(`/pages/${pageId}/tabs`, {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateTab(tabId: number, data: TabInput): Promise<PageTab> {
	return apiRequest<PageTab>(`/pages/tabs/${tabId}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteTab(tabId: number): Promise<void> {
	await apiRequest<void>(`/pages/tabs/${tabId}`, { method: 'DELETE' });
}

export async function createBlock(data: BlockInput): Promise<PageBlock> {
	return apiRequest<PageBlock>('/pages/blocks', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateBlock(blockId: number, data: BlockInput): Promise<PageBlock> {
	return apiRequest<PageBlock>(`/pages/blocks/${blockId}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteBlock(blockId: number): Promise<void> {
	await apiRequest<void>(`/pages/blocks/${blockId}`, { method: 'DELETE' });
}

export async function createParagraph(
	blockId: number,
	data: ParagraphInput,
): Promise<PageParagraph> {
	return apiRequest<PageParagraph>(`/pages/blocks/${blockId}/paragraphs`, {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function updateParagraph(
	paragraphId: number,
	data: ParagraphInput,
): Promise<PageParagraph> {
	return apiRequest<PageParagraph>(`/pages/paragraphs/${paragraphId}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export async function deleteParagraph(paragraphId: number): Promise<void> {
	await apiRequest<void>(`/pages/paragraphs/${paragraphId}`, { method: 'DELETE' });
}

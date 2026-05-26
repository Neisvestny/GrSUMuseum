export interface MenuItemRow {
	id: number;
	parentId: number | null;
	section: string;
	position: number;
	label: string;
	path: string;
	is_active: boolean;
}

export type { BlockNode, PageDocument } from '../domain/document.js';
export { EMPTY_DOCUMENT, isPageDocument, parsePageDocument } from '../domain/document.js';

import {
	EMPTY_DOCUMENT,
	isPageDocument,
	type BlockNode,
	type PageDocument,
} from '@museum/document';

export type { BlockNode, PageDocument };
export { EMPTY_DOCUMENT, isPageDocument };

export function parsePageDocument(value: unknown): PageDocument {
	if (isPageDocument(value)) return value;
	return EMPTY_DOCUMENT;
}

export function newBlockId(): string {
	return crypto.randomUUID();
}

export type BlockNode = {
	id: string;
	type: string;
	schemaVersion: number;
	payload: Record<string, unknown>;
	children: BlockNode[];
};

export type PageDocument = {
	blocks: BlockNode[];
};

export const EMPTY_DOCUMENT: PageDocument = { blocks: [] };

export function isPageDocument(value: unknown): value is PageDocument {
	if (typeof value !== 'object' || value === null) return false;
	return Array.isArray((value as PageDocument).blocks);
}

export function parsePageDocument(value: unknown): PageDocument {
	if (isPageDocument(value)) return value;
	return EMPTY_DOCUMENT;
}

export function newBlockId(): string {
	return crypto.randomUUID();
}

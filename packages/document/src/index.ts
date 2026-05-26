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
	const blocks = (value as PageDocument).blocks;
	return Array.isArray(blocks);
}

export function walkBlocks(
	blocks: BlockNode[],
	visit: (block: BlockNode, depth: number) => void,
	depth = 0,
): void {
	for (const block of blocks) {
		visit(block, depth);
		walkBlocks(block.children, visit, depth + 1);
	}
}

export function findBlockById(blocks: BlockNode[], id: string): BlockNode | null {
	for (const block of blocks) {
		if (block.id === id) return block;
		const found = findBlockById(block.children, id);
		if (found) return found;
	}
	return null;
}

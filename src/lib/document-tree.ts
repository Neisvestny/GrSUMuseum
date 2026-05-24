import type { BlockNode, PageDocument } from '../types/document';
import { createBlock, type BlockType } from './cms-block-registry';

export {
	BLOCK_TYPE_GROUPS,
	BLOCK_TYPE_LABELS,
	TAB_CHILD_BLOCK_TYPES,
	TOP_LEVEL_BLOCK_TYPES,
	createBlock,
	newBlockId,
	type BlockType,
} from './cms-block-registry';

export function normalizeSlugPath(raw: string): string {
	return raw
		.trim()
		.replace(/^\/+|\/+$/g, '')
		.replace(/\/{2,}/g, '/');
}

type BlockVisitor = (
	block: BlockNode,
	ctx: { parent: BlockNode | null; siblings: BlockNode[]; index: number },
) => BlockNode | null;

function mapBlocks(blocks: BlockNode[], visitor: BlockVisitor, parent: BlockNode | null): BlockNode[] {
	const out: BlockNode[] = [];
	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		const mapped = visitor(block, { parent, siblings: blocks, index: i });
		if (mapped === null) continue;
		const children =
			mapped.children.length > 0
				? mapBlocks(mapped.children, visitor, mapped)
				: mapped.children;
		out.push({ ...mapped, children });
	}
	return out;
}

export function updateBlock(
	document: PageDocument,
	blockId: string,
	updater: (block: BlockNode) => BlockNode,
): PageDocument {
	return {
		blocks: mapBlocks(document.blocks, (block) => {
			if (block.id !== blockId) return block;
			return updater(block);
		}, null),
	};
}

export function updateBlockPayload(
	document: PageDocument,
	blockId: string,
	patch: Record<string, unknown>,
): PageDocument {
	return updateBlock(document, blockId, (block) => ({
		...block,
		payload: { ...block.payload, ...patch },
	}));
}

export function removeBlock(document: PageDocument, blockId: string): PageDocument {
	return {
		blocks: mapBlocks(document.blocks, (block) => (block.id === blockId ? null : block), null),
	};
}

export function addRootBlock(document: PageDocument, type: BlockType): PageDocument {
	return { blocks: [...document.blocks, createBlock(type)] };
}

export function addChildBlock(
	document: PageDocument,
	parentId: string,
	type: BlockType,
): PageDocument {
	return updateBlock(document, parentId, (parent) => ({
		...parent,
		children: [...parent.children, createBlock(type)],
	}));
}

export function moveSiblingBlocks(
	document: PageDocument,
	parentId: string | null,
	activeId: string,
	overId: string,
): PageDocument {
	if (parentId === null) {
		const oldIndex = document.blocks.findIndex((b) => b.id === activeId);
		const newIndex = document.blocks.findIndex((b) => b.id === overId);
		if (oldIndex < 0 || newIndex < 0) return document;
		const blocks = [...document.blocks];
		const [removed] = blocks.splice(oldIndex, 1);
		blocks.splice(newIndex, 0, removed);
		return { blocks };
	}

	return updateBlock(document, parentId, (parent) => {
		const oldIndex = parent.children.findIndex((b) => b.id === activeId);
		const newIndex = parent.children.findIndex((b) => b.id === overId);
		if (oldIndex < 0 || newIndex < 0) return parent;
		const children = [...parent.children];
		const [removed] = children.splice(oldIndex, 1);
		children.splice(newIndex, 0, removed);
		return { ...parent, children };
	});
}

export function findBlock(document: PageDocument, blockId: string): BlockNode | null {
	let found: BlockNode | null = null;
	const visit = (blocks: BlockNode[]) => {
		for (const b of blocks) {
			if (b.id === blockId) {
				found = b;
				return;
			}
			visit(b.children);
			if (found) return;
		}
	};
	visit(document.blocks);
	return found;
}

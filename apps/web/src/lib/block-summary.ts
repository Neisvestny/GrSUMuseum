import type { BlockNode } from '@museum/document';
import { readAlternatingItems } from './alternating-block';
import { BLOCK_TYPE_LABELS, type BlockType } from './cms-block-registry';

function truncate(text: string, max = 40): string {
	const t = text.trim();
	if (t.length <= max) return t;
	return `${t.slice(0, max).trim()}…`;
}

function payloadText(payload: Record<string, unknown>, key: string): string {
	return typeof payload[key] === 'string' ? payload[key] : '';
}

export function blockSummary(block: BlockNode): string {
	const { type, payload, children } = block;

	switch (type) {
		case 'hero':
			return truncate(payloadText(payload, 'title')) || 'Обложка';
		case 'heading':
		case 'richText':
		case 'quote':
		case 'callout':
			return truncate(payloadText(payload, 'text')) || BLOCK_TYPE_LABELS[type as BlockType];
		case 'textImage':
			return truncate(payloadText(payload, 'text')) || 'Текст и фото';
		case 'alternating': {
			const count = readAlternatingItems(payload).length;
			return count === 1 ? '1 абзац' : `${count} абзацев`;
		}
		case 'tabs': {
			const tabCount = children.filter((c) => c.type === 'tab').length;
			return tabCount === 1 ? '1 вкладка' : `${tabCount} вкладок`;
		}
		case 'tab': {
			const label = payloadText(payload, 'label') || 'Вкладка';
			const childCount = children.length;
			return childCount > 0 ? `«${label}» · ${childCount} блоков` : `«${label}»`;
		}
		case 'mediaStrip': {
			const items = Array.isArray(payload.items) ? payload.items.length : 0;
			return items > 0 ? `${items} медиа` : 'Медиа-лента';
		}
		case 'imageGallery': {
			const images = Array.isArray(payload.images) ? payload.images.length : 0;
			return images > 0 ? `${images} фото` : 'Галерея';
		}
		default:
			return BLOCK_TYPE_LABELS[type as BlockType] ?? type;
	}
}

export function collectAllBlockIds(blocks: BlockNode[]): string[] {
	const ids: string[] = [];
	const walk = (node: BlockNode) => {
		ids.push(node.id);
		for (const child of node.children) walk(child);
	};
	for (const block of blocks) walk(block);
	return ids;
}

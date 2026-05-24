import { BLOCK_TYPE_LABELS, type BlockType } from '../../../../../lib/cms-block-registry';

export function blockTypeLabel(type: string): string {
	return BLOCK_TYPE_LABELS[type as BlockType] ?? type;
}

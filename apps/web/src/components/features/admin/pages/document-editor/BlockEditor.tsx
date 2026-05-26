import { updateBlockPayload } from '../../../../../lib/document-tree';
import type { BlockNode, PageDocument } from '@museum/document';
import AlternatingBlockEditor from './AlternatingBlockEditor';
import MediaStripBlockEditor from './MediaStripBlockEditor';
import SortableBlockShell from './SortableBlockShell';
import TabsBlockEditor from './TabsBlockEditor';
import GenericBlockEditor from './GenericBlockEditor';
import TextImageBlockEditor from './TextImageBlockEditor';

export default function BlockEditor({
	block,
	document,
	parentId: _parentId,
	onDocumentChange,
	onUpdate,
	onRemove,
}: {
	block: BlockNode;
	document: PageDocument;
	parentId: string | null;
	onDocumentChange: (next: PageDocument) => void;
	onUpdate?: (updater: (b: BlockNode) => BlockNode) => void;
	onRemove: () => void;
}) {
	const patchPayload = (patch: Record<string, unknown>) => {
		if (onUpdate) {
			onUpdate((b) => ({ ...b, payload: { ...b.payload, ...patch } }));
		} else {
			onDocumentChange(updateBlockPayload(document, block.id, patch));
		}
	};

	const body = (() => {
		switch (block.type) {
			case 'tabs':
				return <TabsBlockEditor block={block} document={document} onDocumentChange={onDocumentChange} />;
			case 'tab':
				return null;
			case 'textImage':
				return <TextImageBlockEditor block={block} onChange={patchPayload} />;
			case 'alternating':
				return <AlternatingBlockEditor block={block} onChange={patchPayload} />;
			case 'mediaStrip':
				return <MediaStripBlockEditor block={block} onChange={patchPayload} />;
			default: {
				const generic = (
					<GenericBlockEditor block={block} onChange={patchPayload} />
				);
				if (generic) return generic;
				return (
					<p className="text-sm text-stone-500">
						Тип «{block.type}» пока не поддерживается в редакторе.
					</p>
				);
			}
		}
	})();

	if (block.type === 'tab') return null;

	return (
		<SortableBlockShell id={block.id} type={block.type} onRemove={onRemove}>
			{body}
		</SortableBlockShell>
	);
}

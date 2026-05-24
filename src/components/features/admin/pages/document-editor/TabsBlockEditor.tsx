import { addChildBlock, removeBlock } from '../../../../../lib/document-tree';
import type { BlockNode, PageDocument } from '../../../../../types/document';
import AdminButton from '../../ui/AdminButton';
import TabBlockEditor from './TabBlockEditor';

export default function TabsBlockEditor({
	block,
	document,
	onDocumentChange,
}: {
	block: BlockNode;
	document: PageDocument;
	onDocumentChange: (next: PageDocument) => void;
}) {
	const tabs = block.children.filter((c) => c.type === 'tab');

	return (
		<div className="flex flex-col gap-3">
			{tabs.map((tab) => (
				<TabBlockEditor
					key={tab.id}
					block={tab}
					document={document}
					onDocumentChange={onDocumentChange}
					onRemoveTab={() => {
						if (tabs.length <= 1) return;
						onDocumentChange(removeBlock(document, tab.id));
					}}
				/>
			))}
			<AdminButton
				type="button"
				size="sm"
				variant="secondary"
				onClick={() => onDocumentChange(addChildBlock(document, block.id, 'tab'))}
			>
				+ Добавить вкладку
			</AdminButton>
		</div>
	);
}

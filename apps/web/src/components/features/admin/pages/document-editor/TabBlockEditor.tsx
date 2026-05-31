import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import {
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import {
	BLOCK_TYPE_GROUPS,
	BLOCK_TYPE_LABELS,
	addChildBlock,
	removeBlock,
	type BlockType,
} from '../../../../../lib/document-tree';
import { blockSummary } from '../../../../../lib/block-summary';
import type { BlockNode, PageDocument } from '@museum/document';
import type { MediaItem } from '../../../../../types/media';
import MediaBrowserModal from '../../media/MediaBrowserModal';
import AdminButton from '../../ui/AdminButton';
import { adminInputClass, adminLabelClass } from '../../ui/adminFormStyles';
import { useBlockCollapse } from './BlockCollapseContext';
import BlockEditor from './BlockEditor';
import { ChevronDown, ChevronRight } from 'lucide-react';

function readTabMedia(payload: Record<string, unknown>): MediaItem[] {
	if (!Array.isArray(payload.media)) return [];
	return payload.media as MediaItem[];
}

export default function TabBlockEditor({
	block,
	document,
	onDocumentChange,
	onRemoveTab,
}: {
	block: BlockNode;
	document: PageDocument;
	onDocumentChange: (next: PageDocument) => void;
	onRemoveTab: () => void;
}) {
	const label = typeof block.payload.label === 'string' ? block.payload.label : '';
	const media = readTabMedia(block.payload);
	const [mediaOpen, setMediaOpen] = useState(false);
	const [addType, setAddType] = useState<BlockType>('richText');
	const { isCollapsed, toggle } = useBlockCollapse();
	const collapsed = isCollapsed(block.id);
	const summary = blockSummary(block);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

	const patchTab = (patch: Record<string, unknown>) => {
		onDocumentChange({
			blocks: document.blocks.map((root) =>
				updateInTree(root, block.id, (b) => ({ ...b, payload: { ...b.payload, ...patch } })),
			),
		});
	};

	const updateChild = (childId: string, updater: (b: BlockNode) => BlockNode) => {
		onDocumentChange({
			blocks: document.blocks.map((root) =>
				updateInTree(root, childId, updater),
			),
		});
	};

	return (
		<div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 flex flex-col gap-3">
			<div className="flex flex-wrap gap-2 items-end">
				<button
					type="button"
					className="text-stone-500 hover:text-stone-700 p-0.5 self-end mb-2"
					onClick={() => toggle(block.id)}
					aria-label={collapsed ? 'Развернуть вкладку' : 'Свернуть вкладку'}
					aria-expanded={!collapsed}
				>
					{collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
				</button>
				<div className="flex-1 min-w-[140px]">
					<label className={adminLabelClass}>Название вкладки</label>
					<input
						className={adminInputClass}
						value={label}
						onChange={(e) => patchTab({ label: e.target.value })}
					/>
					{collapsed && (
						<p className="text-xs text-stone-500 mt-1 truncate">{summary}</p>
					)}
				</div>
				<AdminButton type="button" size="sm" variant="secondary" onClick={() => setMediaOpen(true)}>
					Медиа вкладки ({media.length})
				</AdminButton>
				<AdminButton type="button" size="sm" variant="danger" onClick={onRemoveTab}>
					Удалить вкладку
				</AdminButton>
			</div>

			{!collapsed && (
			<div className="flex flex-col gap-2 pl-2 border-l-2 border-blue-200">
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={({ active, over }) => {
						if (!over || active.id === over.id) return;
						onDocumentChange(
							moveTabChildren(document, block.id, String(active.id), String(over.id)),
						);
					}}
				>
					<SortableContext
						items={block.children.map((c) => c.id)}
						strategy={verticalListSortingStrategy}
					>
						{block.children.map((child) => (
							<BlockEditor
								key={child.id}
								block={child}
								document={document}
								parentId={block.id}
								onDocumentChange={onDocumentChange}
								onUpdate={(updater) => updateChild(child.id, updater)}
								onRemove={() =>
									onDocumentChange(removeBlock(document, child.id))
								}
							/>
						))}
					</SortableContext>
				</DndContext>

				<div className="flex flex-wrap gap-2 items-center">
					<select
						className={adminInputClass}
						value={addType}
						onChange={(e) => setAddType(e.target.value as BlockType)}
					>
						{BLOCK_TYPE_GROUPS.filter((g) => g.label !== 'Структура').map((group) => (
							<optgroup key={group.label} label={group.label}>
								{group.types.map((t) => (
									<option key={t} value={t}>
										{BLOCK_TYPE_LABELS[t]}
									</option>
								))}
							</optgroup>
						))}
					</select>
					<AdminButton
						type="button"
						size="sm"
						onClick={() =>
							onDocumentChange(addChildBlock(document, block.id, addType))
						}
					>
						Добавить блок во вкладку
					</AdminButton>
				</div>
			</div>
			)}

			<MediaBrowserModal
				open={mediaOpen}
				title="Медиа вкладки"
				initialSelected={media}
				onClose={() => setMediaOpen(false)}
				onConfirm={(items) => {
					patchTab({ media: items });
					setMediaOpen(false);
				}}
			/>
		</div>
	);
}

function updateInTree(node: BlockNode, id: string, updater: (b: BlockNode) => BlockNode): BlockNode {
	if (node.id === id) return updater(node);
	return {
		...node,
		children: node.children.map((c) => updateInTree(c, id, updater)),
	};
}

function moveTabChildren(
	document: PageDocument,
	tabId: string,
	activeId: string,
	overId: string,
): PageDocument {
	return {
		blocks: document.blocks.map((root) => reorderInTab(root, tabId, activeId, overId)),
	};
}

function reorderInTab(node: BlockNode, tabId: string, activeId: string, overId: string): BlockNode {
	if (node.id === tabId) {
		const oldIndex = node.children.findIndex((c) => c.id === activeId);
		const newIndex = node.children.findIndex((c) => c.id === overId);
		if (oldIndex < 0 || newIndex < 0) return node;
		const children = [...node.children];
		const [removed] = children.splice(oldIndex, 1);
		children.splice(newIndex, 0, removed);
		return { ...node, children };
	}
	return { ...node, children: node.children.map((c) => reorderInTab(c, tabId, activeId, overId)) };
}

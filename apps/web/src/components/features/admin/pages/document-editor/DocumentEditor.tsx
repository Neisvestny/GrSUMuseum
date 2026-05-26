import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import {
	BLOCK_TYPE_GROUPS,
	BLOCK_TYPE_LABELS,
	addRootBlock,
	moveSiblingBlocks,
	removeBlock,
	type BlockType,
} from '../../../../../lib/document-tree';
import type { PageDocument } from '@museum/document';
import BlockRenderer from '../../../../cms/BlockRenderer';
import AdminButton from '../../ui/AdminButton';
import { adminInputClass, adminLabelClass } from '../../ui/adminFormStyles';
import BlockEditor from './BlockEditor';

export default function DocumentEditor({
	document,
	pageTitle,
	onChange,
}: {
	document: PageDocument;
	pageTitle: string;
	onChange: (next: PageDocument) => void;
}) {
	const [addType, setAddType] = useState<BlockType>('hero');
	const [showPreview, setShowPreview] = useState(true);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap gap-2 items-center">
				<label className={adminLabelClass}>Добавить блок</label>
				<select
					className={adminInputClass}
					value={addType}
					onChange={(e) => setAddType(e.target.value as BlockType)}
				>
					{BLOCK_TYPE_GROUPS.map((group) => (
						<optgroup key={group.label} label={group.label}>
							{group.types.map((t) => (
								<option key={t} value={t}>
									{BLOCK_TYPE_LABELS[t]}
								</option>
							))}
						</optgroup>
					))}
				</select>
				<AdminButton type="button" size="sm" onClick={() => onChange(addRootBlock(document, addType))}>
					Добавить
				</AdminButton>
				<div className="flex-1" />
				<AdminButton
					type="button"
					size="sm"
					variant="secondary"
					onClick={() => setShowPreview((v) => !v)}
				>
					{showPreview ? 'Скрыть превью' : 'Показать превью'}
				</AdminButton>
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={({ active, over }) => {
					if (!over || active.id === over.id) return;
					onChange(
						moveSiblingBlocks(document, null, String(active.id), String(over.id)),
					);
				}}
			>
				<SortableContext
					items={document.blocks.map((b) => b.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="flex flex-col gap-3">
						{document.blocks.length === 0 ? (
							<p className="text-sm text-stone-500">
								Нет блоков. Добавьте «Вкладки» или «Текст и фото».
							</p>
						) : (
							document.blocks.map((block) => (
								<BlockEditor
									key={block.id}
									block={block}
									document={document}
									parentId={null}
									onDocumentChange={onChange}
									onRemove={() => onChange(removeBlock(document, block.id))}
								/>
							))
						)}
					</div>
				</SortableContext>
			</DndContext>

			{showPreview && (
				<div className="rounded-xl border-2 border-dashed border-stone-300 p-4 bg-stone-50">
					<h3 className="text-sm font-medium text-stone-700 mb-3">Превью (как на киоске)</h3>
					<BlockRenderer document={document} pageTitle={pageTitle} />
				</div>
			)}

			<details className="text-sm">
				<summary className="cursor-pointer text-stone-500 hover:text-stone-700">
					Для разработчиков: JSON
				</summary>
				<pre className="mt-2 p-3 bg-stone-900 text-stone-100 rounded-lg text-xs overflow-auto max-h-48">
					{JSON.stringify(document, null, 2)}
				</pre>
			</details>
		</div>
	);
}

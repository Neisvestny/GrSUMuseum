import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminButton from '../../ui/AdminButton';
import { blockTypeLabel } from './block-labels';

export default function SortableBlockShell({
	id,
	type,
	onRemove,
	children,
}: {
	id: string;
	type: string;
	onRemove: () => void;
	children: ReactNode;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="rounded-xl border-2 border-stone-200 bg-white p-4 shadow-sm"
		>
			<div className="flex items-center gap-2 mb-3">
				<button
					type="button"
					className="cursor-grab text-stone-400 hover:text-stone-600 touch-none"
					{...attributes}
					{...listeners}
					aria-label="Перетащить"
				>
					<GripVertical size={18} />
				</button>
				<span className="text-sm font-semibold text-stone-800">{blockTypeLabel(type)}</span>
				<div className="flex-1" />
				<AdminButton type="button" variant="danger" size="sm" onClick={onRemove}>
					Удалить
				</AdminButton>
			</div>
			{children}
		</div>
	);
}

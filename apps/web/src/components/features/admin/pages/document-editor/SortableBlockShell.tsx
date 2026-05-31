import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminButton from '../../ui/AdminButton';
import { useBlockCollapse } from './BlockCollapseContext';
import { blockTypeLabel } from './block-labels';

export default function SortableBlockShell({
	id,
	type,
	summary,
	onRemove,
	children,
}: {
	id: string;
	type: string;
	summary?: string;
	onRemove: () => void;
	children: ReactNode;
}) {
	const { isCollapsed, toggle } = useBlockCollapse();
	const collapsed = isCollapsed(id);

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
			<div className={`flex items-center gap-2 ${collapsed ? '' : 'mb-3'}`}>
				<button
					type="button"
					className="cursor-grab text-stone-400 hover:text-stone-600 touch-none"
					{...attributes}
					{...listeners}
					aria-label="Перетащить"
				>
					<GripVertical size={18} />
				</button>
				<button
					type="button"
					className="text-stone-500 hover:text-stone-700 p-0.5"
					onClick={() => toggle(id)}
					aria-label={collapsed ? 'Развернуть блок' : 'Свернуть блок'}
					aria-expanded={!collapsed}
				>
					{collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
				</button>
				<div className="min-w-0 flex-1">
					<span className="text-sm font-semibold text-stone-800">{blockTypeLabel(type)}</span>
					{collapsed && summary && (
						<span className="block text-xs text-stone-500 truncate">{summary}</span>
					)}
				</div>
				<AdminButton type="button" variant="danger" size="sm" onClick={onRemove}>
					Удалить
				</AdminButton>
			</div>
			{!collapsed && children}
		</div>
	);
}

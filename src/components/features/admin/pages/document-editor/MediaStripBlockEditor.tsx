import { useState } from 'react';
import type { BlockNode, MediaItem } from '../../../../../types/document';
import MediaBrowserModal from '../../media/MediaBrowserModal';
import AdminButton from '../../ui/AdminButton';
import { adminInputClass, adminLabelClass } from '../../ui/adminFormStyles';

function readItems(payload: Record<string, unknown>): MediaItem[] {
	if (!Array.isArray(payload.items)) return [];
	return payload.items.filter(
		(it): it is MediaItem =>
			typeof it === 'object' &&
			it !== null &&
			(it as MediaItem).kind !== undefined &&
			typeof (it as MediaItem).src === 'string',
	);
}

export default function MediaStripBlockEditor({
	block,
	onChange,
}: {
	block: BlockNode;
	onChange: (patch: Record<string, unknown>) => void;
}) {
	const items = readItems(block.payload);
	const [pickerOpen, setPickerOpen] = useState(false);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-2">
				<span className="text-sm text-stone-600">Элементов: {items.length}</span>
				<AdminButton type="button" size="sm" onClick={() => setPickerOpen(true)}>
					Выбрать из галереи
				</AdminButton>
			</div>
			{items.map((item, index) => (
				<div key={`${item.kind}-${item.src}-${index}`} className="flex gap-2 items-start border rounded-lg p-2">
					<div className="flex-1 min-w-0">
						<p className="text-xs text-stone-500 truncate">{item.src}</p>
						<label className={adminLabelClass}>Подпись</label>
						<input
							className={adminInputClass}
							value={item.title ?? ''}
							onChange={(e) => {
								const next = items.map((it, i) =>
									i === index ? { ...it, title: e.target.value } : it,
								);
								onChange({ items: next });
							}}
						/>
					</div>
					<AdminButton
						type="button"
						variant="danger"
						size="sm"
						onClick={() => onChange({ items: items.filter((_, i) => i !== index) })}
					>
						×
					</AdminButton>
				</div>
			))}
			<MediaBrowserModal
				open={pickerOpen}
				title="Медиа для ленты"
				initialSelected={items}
				onClose={() => setPickerOpen(false)}
				onConfirm={(selected) => {
					onChange({ items: selected });
					setPickerOpen(false);
				}}
			/>
		</div>
	);
}

import type { BlockNode } from '@museum/document';
import {
	emptyAlternatingItem,
	readAlternatingItems,
	type AlternatingItem,
} from '../../../../../lib/alternating-block';
import ImagePathInput from '../../ui/ImagePathInput';
import AdminButton from '../../ui/AdminButton';
import { adminInputClass, adminLabelClass } from '../../ui/adminFormStyles';

export default function AlternatingBlockEditor({
	block,
	onChange,
}: {
	block: BlockNode;
	onChange: (patch: Record<string, unknown>) => void;
}) {
	const items = readAlternatingItems(block.payload);

	const updateItems = (next: AlternatingItem[]) => {
		onChange({ items: next, text: undefined, image: undefined, img: undefined });
	};

	return (
		<div className="flex flex-col gap-3">
			<p className="text-xs text-stone-500">
				Фото чередуются: 1-е слева, 2-е справа и т.д. Абзацы без фото не сбрасывают
				счётчик.
			</p>
			{items.map((item, index) => (
				<div
					key={index}
					className="rounded-lg border border-stone-200 p-3 flex flex-col gap-3 bg-stone-50/50"
				>
					<div className="flex items-center justify-between gap-2">
						<span className="text-sm font-medium text-stone-700">Абзац {index + 1}</span>
						<AdminButton
							type="button"
							size="sm"
							variant="danger"
							disabled={items.length <= 1}
							onClick={() => updateItems(items.filter((_, i) => i !== index))}
						>
							Удалить
						</AdminButton>
					</div>
					<div>
						<label className={adminLabelClass}>Текст</label>
						<textarea
							className={`${adminInputClass} min-h-[100px]`}
							value={item.text}
							onChange={(e) => {
								const next = [...items];
								next[index] = { ...next[index], text: e.target.value };
								updateItems(next);
							}}
						/>
					</div>
					<ImagePathInput
						label="Фото (необязательно)"
						value={item.image ?? ''}
						onChange={(src) => {
							const next = [...items];
							next[index] = { ...next[index], image: src || undefined };
							updateItems(next);
						}}
					/>
				</div>
			))}
			<AdminButton
				type="button"
				size="sm"
				variant="secondary"
				onClick={() => updateItems([...items, emptyAlternatingItem()])}
			>
				+ Добавить абзац
			</AdminButton>
		</div>
	);
}

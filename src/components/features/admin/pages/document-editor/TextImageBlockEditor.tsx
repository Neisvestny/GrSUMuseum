import type { BlockNode } from '../../../../../types/document';
import ImagePathInput from '../../ui/ImagePathInput';
import { adminInputClass, adminLabelClass } from '../../ui/adminFormStyles';

export default function TextImageBlockEditor({
	block,
	onChange,
}: {
	block: BlockNode;
	onChange: (patch: Record<string, unknown>) => void;
}) {
	const text = typeof block.payload.text === 'string' ? block.payload.text : '';
	const image =
		typeof block.payload.image === 'string'
			? block.payload.image
			: typeof block.payload.img === 'string'
				? block.payload.img
				: '';

	return (
		<div className="flex flex-col gap-3">
			<div>
				<label className={adminLabelClass}>Текст</label>
				<textarea
					className={`${adminInputClass} min-h-[120px]`}
					value={text}
					onChange={(e) => onChange({ text: e.target.value })}
				/>
			</div>
			<ImagePathInput
				label="Изображение"
				value={image}
				onChange={(src) => onChange({ image: src, img: src })}
			/>
		</div>
	);
}

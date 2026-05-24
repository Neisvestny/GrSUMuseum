import type { BlockNode } from '../../../../../types/document';
import ImagePathInput from '../../ui/ImagePathInput';
import { RecordListEditor, SelectInput, StringListEditor, TextArea, TextInput } from './editorHelpers';
import { blockPayload, bool, num, recordArray, str, stringArray } from '../../../../../components/cms/blocks/payload';

export default function GenericBlockEditor({
	block,
	onChange,
}: {
	block: BlockNode;
	onChange: (patch: Record<string, unknown>) => void;
}) {
	const p = blockPayload(block);

	switch (block.type) {
		case 'hero':
			return (
				<div className="flex flex-col gap-3">
					<TextInput label="Заголовок" value={str(p, 'title')} onChange={(title) => onChange({ title })} />
					<TextArea label="Подзаголовок" value={str(p, 'subtitle')} onChange={(subtitle) => onChange({ subtitle })} rows={2} />
					<ImagePathInput label="Фоновое фото" value={str(p, 'image')} onChange={(image) => onChange({ image, img: image })} />
					<div className="grid grid-cols-2 gap-2">
						<TextInput label="Текст кнопки" value={str(p, 'buttonLabel')} onChange={(buttonLabel) => onChange({ buttonLabel })} />
						<TextInput label="Ссылка кнопки" value={str(p, 'buttonHref')} onChange={(buttonHref) => onChange({ buttonHref })} />
					</div>
					<SelectInput
						label="Выравнивание"
						value={str(p, 'align', 'left')}
						onChange={(align) => onChange({ align })}
						options={[
							{ value: 'left', label: 'Слева' },
							{ value: 'center', label: 'По центру' },
						]}
					/>
				</div>
			);
		case 'heading':
			return (
				<div className="flex flex-col gap-3">
					<TextInput label="Текст" value={str(p, 'text')} onChange={(text) => onChange({ text })} />
					<SelectInput
						label="Уровень"
						value={String(num(p, 'level', 2))}
						onChange={(v) => onChange({ level: Number(v) })}
						options={[
							{ value: '2', label: 'H2 — крупный' },
							{ value: '3', label: 'H3 — средний' },
							{ value: '4', label: 'H4 — мелкий' },
						]}
					/>
					<SelectInput
						label="Выравнивание"
						value={str(p, 'align', 'left')}
						onChange={(align) => onChange({ align })}
						options={[
							{ value: 'left', label: 'Слева' },
							{ value: 'center', label: 'Центр' },
							{ value: 'right', label: 'Справа' },
						]}
					/>
				</div>
			);
		case 'richText':
			return (
				<div className="flex flex-col gap-3">
					<TextArea label="Текст" value={str(p, 'text')} onChange={(text) => onChange({ text })} rows={8} />
					<SelectInput
						label="Выравнивание"
						value={str(p, 'align', 'left')}
						onChange={(align) => onChange({ align })}
						options={[
							{ value: 'left', label: 'Слева' },
							{ value: 'center', label: 'Центр' },
						]}
					/>
				</div>
			);
		case 'quote':
			return (
				<div className="flex flex-col gap-3">
					<TextArea label="Цитата" value={str(p, 'text')} onChange={(text) => onChange({ text })} rows={4} />
					<TextInput label="Автор" value={str(p, 'author')} onChange={(author) => onChange({ author })} />
				</div>
			);
		case 'callout':
			return (
				<div className="flex flex-col gap-3">
					<SelectInput
						label="Тип"
						value={str(p, 'variant', 'info')}
						onChange={(variant) => onChange({ variant })}
						options={[
							{ value: 'info', label: 'Информация' },
							{ value: 'success', label: 'Успех' },
							{ value: 'warning', label: 'Внимание' },
							{ value: 'neutral', label: 'Нейтральный' },
						]}
					/>
					<TextInput label="Заголовок" value={str(p, 'title')} onChange={(title) => onChange({ title })} />
					<TextArea label="Текст" value={str(p, 'text')} onChange={(text) => onChange({ text })} rows={3} />
				</div>
			);
		case 'stats':
			return (
				<RecordListEditor
					label="Показатели"
					items={recordArray(p, 'items')}
					onChange={(items) => onChange({ items })}
					fields={[
						{ key: 'value', label: 'Число', placeholder: '100+' },
						{ key: 'label', label: 'Подпись', placeholder: 'Студентов' },
					]}
					makeEmpty={() => ({ value: '', label: '' })}
				/>
			);
		case 'features':
			return (
				<RecordListEditor
					label="Карточки"
					items={recordArray(p, 'items')}
					onChange={(items) => onChange({ items })}
					fields={[
						{ key: 'icon', label: 'Иконка (emoji)', placeholder: '🎓' },
						{ key: 'title', label: 'Заголовок' },
						{ key: 'text', label: 'Текст' },
					]}
					makeEmpty={() => ({ icon: '✦', title: '', text: '' })}
				/>
			);
		case 'accordion':
			return (
				<RecordListEditor
					label="Пункты аккордеона"
					items={recordArray(p, 'items')}
					onChange={(items) => onChange({ items })}
					fields={[
						{ key: 'title', label: 'Вопрос / заголовок' },
						{ key: 'body', label: 'Ответ / текст' },
					]}
					makeEmpty={() => ({ title: '', body: '' })}
				/>
			);
		case 'timeline':
			return (
				<RecordListEditor
					label="События"
					items={recordArray(p, 'items')}
					onChange={(items) => onChange({ items })}
					fields={[
						{ key: 'year', label: 'Год' },
						{ key: 'title', label: 'Заголовок' },
						{ key: 'text', label: 'Описание' },
					]}
					makeEmpty={() => ({ year: '', title: '', text: '' })}
				/>
			);
		case 'buttonRow':
			return (
				<div className="flex flex-col gap-3">
					<SelectInput
						label="Выравнивание"
						value={str(p, 'align', 'left')}
						onChange={(align) => onChange({ align })}
						options={[
							{ value: 'left', label: 'Слева' },
							{ value: 'center', label: 'Центр' },
							{ value: 'right', label: 'Справа' },
						]}
					/>
					<RecordListEditor
						label="Кнопки"
						items={recordArray(p, 'buttons')}
						onChange={(buttons) => onChange({ buttons })}
						fields={[
							{ key: 'label', label: 'Текст' },
							{ key: 'href', label: 'Ссылка' },
							{ key: 'variant', label: 'primary / secondary' },
						]}
						makeEmpty={() => ({ label: 'Кнопка', href: '/', variant: 'primary' })}
					/>
				</div>
			);
		case 'divider':
			return (
				<div className="grid grid-cols-2 gap-3">
					<SelectInput
						label="Стиль"
						value={str(p, 'style', 'line')}
						onChange={(style) => onChange({ style })}
						options={[
							{ value: 'line', label: 'Линия' },
							{ value: 'space', label: 'Отступ' },
						]}
					/>
					<SelectInput
						label="Размер"
						value={str(p, 'size', 'md')}
						onChange={(size) => onChange({ size })}
						options={[
							{ value: 'sm', label: 'Маленький' },
							{ value: 'md', label: 'Средний' },
							{ value: 'lg', label: 'Большой' },
						]}
					/>
				</div>
			);
		case 'embed':
			return (
				<div className="flex flex-col gap-3">
					<TextInput label="URL (YouTube или iframe)" value={str(p, 'url')} onChange={(url) => onChange({ url })} />
					<TextInput label="Подпись" value={str(p, 'title')} onChange={(title) => onChange({ title })} />
					<TextInput
						label="Высота (px)"
						value={String(num(p, 'height', 400))}
						onChange={(v) => onChange({ height: Number(v) || 400 })}
					/>
				</div>
			);
		case 'imageGallery':
			return (
				<div className="flex flex-col gap-3">
					<SelectInput
						label="Колонок"
						value={String(num(p, 'columns', 3))}
						onChange={(v) => onChange({ columns: Number(v) })}
						options={[
							{ value: '2', label: '2' },
							{ value: '3', label: '3' },
							{ value: '4', label: '4' },
						]}
					/>
					<StringListEditor
						label="URL изображений"
						items={stringArray(p, 'images').length ? stringArray(p, 'images') : ['']}
						onChange={(images) => onChange({ images })}
						placeholder="/images/photo.jpg"
					/>
				</div>
			);
		case 'twoColumns':
			return (
				<RecordListEditor
					label="Колонки"
					items={recordArray(p, 'columns')}
					onChange={(columns) => onChange({ columns })}
					fields={[
						{ key: 'title', label: 'Заголовок колонки' },
						{ key: 'text', label: 'Текст' },
					]}
					makeEmpty={() => ({ title: '', text: '' })}
				/>
			);
		case 'video':
			return (
				<div className="flex flex-col gap-3">
					<TextInput label="URL видео" value={str(p, 'src')} onChange={(src) => onChange({ src })} />
					<TextInput label="Заголовок" value={str(p, 'title')} onChange={(title) => onChange({ title })} />
					<ImagePathInput label="Постер" value={str(p, 'poster')} onChange={(poster) => onChange({ poster })} />
					<label className="flex items-center gap-2 text-sm font-semibold text-blue-800">
						<input
							type="checkbox"
							checked={bool(p, 'is_external')}
							onChange={(e) => onChange({ is_external: e.target.checked })}
						/>
						Внешняя ссылка (YouTube)
					</label>
				</div>
			);
		case 'list':
			return (
				<div className="flex flex-col gap-3">
					<SelectInput
						label="Тип списка"
						value={str(p, 'style', 'bullet')}
						onChange={(style) => onChange({ style })}
						options={[
							{ value: 'bullet', label: 'Маркеры' },
							{ value: 'number', label: 'Нумерация' },
						]}
					/>
					<StringListEditor
						label="Пункты"
						items={stringArray(p, 'items').length ? stringArray(p, 'items') : ['']}
						onChange={(items) => onChange({ items })}
					/>
				</div>
			);
		default:
			return null;
	}
}

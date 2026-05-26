import { useState } from 'react';
import type { PersonMutation, TaxonomyBundle } from '../../../../api/people';
import { InlineError } from '../../../design-system/States';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';
import ImagePathInput from '../ui/ImagePathInput';
import TaxonomyMultiSelect from './TaxonomyMultiSelect';
import { EMPTY_PERSON_FORM } from './constants';

type Props = {
	initial?: PersonMutation;
	taxonomy: TaxonomyBundle;
	onSave: (data: PersonMutation) => Promise<void>;
	onCancel: () => void;
	busy?: boolean;
};

const inp = adminInputClass;
const lbl = adminLabelClass;

export default function PersonForm({
	initial,
	taxonomy,
	onSave,
	onCancel,
	busy = false,
}: Props) {
	const [form, setForm] = useState<PersonMutation>({
		...EMPTY_PERSON_FORM,
		...initial,
		images: initial?.images?.length ? initial.images : [''],
		files: initial?.files?.length ? initial.files : [{ title: '', url: '' }],
		roleSlugs: initial?.roleSlugs ?? [],
		tagSlugs: initial?.tagSlugs ?? [],
		categorySlugs: initial?.categorySlugs ?? [],
	});
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const set = <K extends keyof PersonMutation>(k: K, v: PersonMutation[K]) =>
		setForm((f) => ({ ...f, [k]: v }));

	const setImage = (idx: number, val: string) => {
		const next = [...(form.images ?? [])];
		next[idx] = val;
		set('images', next);
	};

	const setFile = (idx: number, field: 'title' | 'url', val: string) => {
		const next = [...(form.files ?? [])];
		next[idx] = { ...next[idx], [field]: val };
		set('files', next);
	};

	const handleSave = async () => {
		if (!form.lastName?.trim()) {
			setErr('Укажите фамилию');
			return;
		}
		if (!form.firstName?.trim()) {
			setErr('Укажите имя');
			return;
		}
		if (form.yearTo != null && form.yearFrom != null && form.yearTo < form.yearFrom) {
			setErr('Год окончания не может быть раньше года начала');
			return;
		}
		setSaving(true);
		setErr(null);
		try {
			await onSave({
				...form,
				patronymic: form.patronymic?.trim() ? form.patronymic.trim() : null,
			});
		} catch (error) {
			setErr(error instanceof Error ? error.message : 'Ошибка сохранения');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			{err && <InlineError text={err} />}

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<label>
					<span className={lbl}>Фамилия *</span>
					<input
						className={inp}
						value={form.lastName ?? ''}
						onChange={(e) => set('lastName', e.target.value)}
						placeholder="Иванов"
					/>
				</label>
				<label>
					<span className={lbl}>Имя *</span>
					<input
						className={inp}
						value={form.firstName ?? ''}
						onChange={(e) => set('firstName', e.target.value)}
						placeholder="Иван"
					/>
				</label>
				<label>
					<span className={lbl}>Отчество</span>
					<input
						className={inp}
						value={form.patronymic ?? ''}
						onChange={(e) => set('patronymic', e.target.value)}
						placeholder="Иванович"
					/>
				</label>
			</div>

			<label>
				<span className={lbl}>Подзаголовок / должность</span>
				<input
					className={inp}
					value={form.subtitle ?? ''}
					onChange={(e) => set('subtitle', e.target.value)}
					placeholder="Ректор, профессор кафедры…"
				/>
			</label>

			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				<label>
					<span className={lbl}>Год с</span>
					<input
						className={inp}
						type="number"
						min={1800}
						max={2100}
						value={form.yearFrom ?? ''}
						onChange={(e) => set('yearFrom', Number(e.target.value) || 0)}
					/>
				</label>
				<label>
					<span className={lbl}>Год по</span>
					<input
						className={inp}
						type="number"
						min={1800}
						max={2100}
						value={form.yearTo ?? ''}
						onChange={(e) =>
							set('yearTo', e.target.value === '' ? null : Number(e.target.value))
						}
						placeholder="не указан"
					/>
				</label>
				<label>
					<span className={lbl}>Порядок сортировки</span>
					<input
						className={inp}
						type="number"
						value={form.sortOrder ?? ''}
						onChange={(e) =>
							set('sortOrder', e.target.value === '' ? undefined : Number(e.target.value))
						}
						placeholder="авто"
					/>
				</label>
			</div>

			<TaxonomyMultiSelect
				label="Роли"
				options={taxonomy.roles}
				selected={form.roleSlugs ?? []}
				onChange={(slugs) => set('roleSlugs', slugs)}
			/>
			<TaxonomyMultiSelect
				label="Теги"
				options={taxonomy.tags}
				selected={form.tagSlugs ?? []}
				onChange={(slugs) => set('tagSlugs', slugs)}
			/>
			<TaxonomyMultiSelect
				label="Категории"
				options={taxonomy.categories}
				selected={form.categorySlugs ?? []}
				onChange={(slugs) => set('categorySlugs', slugs)}
			/>

			<label>
				<span className={lbl}>Краткое описание</span>
				<textarea
					className={`${inp} resize-none h-16`}
					value={form.shortDescription ?? ''}
					onChange={(e) => set('shortDescription', e.target.value)}
				/>
			</label>
			<label>
				<span className={lbl}>Полная биография</span>
				<textarea
					className={`${inp} resize-none h-28`}
					value={form.fullDescription ?? ''}
					onChange={(e) => set('fullDescription', e.target.value)}
				/>
			</label>

			<ImagePathInput value={form.img ?? ''} onChange={(next) => set('img', next)} />

			<div>
				<span className={lbl}>Галерея фотографий</span>
				<div className="flex flex-col gap-2">
					{(form.images ?? ['']).map((url, idx) => (
						<div key={idx} className="flex gap-2">
							<input
								className={inp}
								value={url}
								onChange={(e) => setImage(idx, e.target.value)}
								placeholder={`Фото ${idx + 1} — URL`}
							/>
							<button
								type="button"
								onClick={() =>
									set(
										'images',
										(form.images ?? []).filter((_, i) => i !== idx),
									)
								}
								className="px-3 py-2 rounded-xl border-2 border-red-200 text-red-500 text-sm hover:bg-red-50 shrink-0"
							>
								✕
							</button>
						</div>
					))}
					<button
						type="button"
						onClick={() => set('images', [...(form.images ?? []), ''])}
						className="text-sm text-blue-600 font-semibold text-left hover:text-blue-800"
					>
						+ Добавить фото
					</button>
				</div>
			</div>

			<div>
				<span className={lbl}>Документы</span>
				<div className="flex flex-col gap-2">
					{(form.files ?? [{ title: '', url: '' }]).map((f, idx) => (
						<div key={idx} className="flex gap-2">
							<input
								className={inp}
								value={f.title ?? ''}
								onChange={(e) => setFile(idx, 'title', e.target.value)}
								placeholder="Название"
							/>
							<input
								className={inp}
								value={f.url}
								onChange={(e) => setFile(idx, 'url', e.target.value)}
								placeholder="URL"
							/>
							<button
								type="button"
								onClick={() =>
									set(
										'files',
										(form.files ?? []).filter((_, i) => i !== idx),
									)
								}
								className="px-3 py-2 rounded-xl border-2 border-red-200 text-red-500 text-sm hover:bg-red-50 shrink-0"
							>
								✕
							</button>
						</div>
					))}
					<button
						type="button"
						onClick={() => set('files', [...(form.files ?? []), { title: '', url: '' }])}
						className="text-sm text-blue-600 font-semibold text-left hover:text-blue-800"
					>
						+ Добавить файл
					</button>
				</div>
			</div>

			<div className="flex gap-2 pt-1">
				<button
					type="button"
					onClick={() => void handleSave()}
					disabled={saving || busy}
					className="flex-1 py-2 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 disabled:opacity-40"
				>
					{saving ? 'Сохранение…' : 'Сохранить'}
				</button>
				<button
					type="button"
					onClick={onCancel}
					disabled={saving || busy}
					className="flex-1 py-2 rounded-xl border-2 border-blue-200 text-blue-700 font-semibold text-sm hover:bg-blue-50 disabled:opacity-40"
				>
					Отмена
				</button>
			</div>
		</div>
	);
}

import { useState } from 'react';
import type { Rector } from '../../../../api/rectors';
import { InlineError } from '../../../design-system/States';
import { EMPTY_RECTOR } from './constants';

type Props = {
	initial: Partial<Rector>;
	onSave: (data: Partial<Rector>) => Promise<void>;
	onCancel: () => void;
	busy: boolean;
};

const inp =
	'w-full px-3 py-2 rounded-xl border-2 border-blue-200 bg-white text-gray-800 text-sm focus:outline-none focus:border-blue-500 transition-colors';
const lbl = 'text-xs font-semibold text-blue-700 mb-1 block';

export default function RectorForm({ initial, onSave, onCancel, busy }: Props) {
	const [form, setForm] = useState<Partial<Rector>>({
		...EMPTY_RECTOR,
		...initial,
		images: initial.images?.length ? initial.images : [''],
		files: initial.files?.length ? initial.files : [{ name: '', url: '' }],
	});
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const set = <K extends keyof Rector>(k: K, v: Rector[K]) => setForm((f) => ({ ...f, [k]: v }));
	const setImage = (idx: number, val: string) => {
		const next = [...(form.images ?? [])];
		next[idx] = val;
		set('images', next);
	};
	const setFile = (idx: number, field: 'name' | 'url', val: string) => {
		const next = [...(form.files ?? [])];
		next[idx] = { ...next[idx], [field]: val };
		set('files', next);
	};

	const handleSave = async () => {
		if (!form.name?.trim()) {
			setErr('Введите ФИО ректора');
			return;
		}
		setSaving(true);
		setErr(null);
		try {
			await onSave(form);
		} catch (error) {
			setErr(error instanceof Error ? error.message : 'Ошибка сохранения');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			{err && <InlineError text={err} />}
			<label>
				<span className={lbl}>ФИО *</span>
				<input
					className={inp}
					value={form.name ?? ''}
					onChange={(e) => set('name', e.target.value)}
					placeholder="Иванов Иван Иванович"
				/>
			</label>
			<label>
				<span className={lbl}>Годы правления</span>
				<input
					className={inp}
					value={form.years ?? ''}
					onChange={(e) => set('years', e.target.value)}
					placeholder="1940 — 1950"
				/>
			</label>
			<label>
				<span className={lbl}>Краткое описание</span>
				<textarea
					className={`${inp} resize-none h-16`}
					value={form.description ?? ''}
					onChange={(e) => set('description', e.target.value)}
					placeholder="Для карточки на странице ректоров"
				/>
			</label>
			<label>
				<span className={lbl}>Полная биография</span>
				<textarea
					className={`${inp} resize-none h-28`}
					value={form.full_text ?? ''}
					onChange={(e) => set('full_text', e.target.value)}
					placeholder="Подробный текст для страницы ректора"
				/>
			</label>
			<label>
				<span className={lbl}>Главное фото (URL или /путь)</span>
				<input
					className={inp}
					value={form.img ?? ''}
					onChange={(e) => set('img', e.target.value)}
					placeholder="/images/rector.jpg"
				/>
			</label>

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
								className="px-3 py-2 rounded-xl border-2 border-red-200 text-red-500 text-sm hover:bg-red-50 transition-all shrink-0"
							>
								✕
							</button>
						</div>
					))}
					<button
						type="button"
						onClick={() => set('images', [...(form.images ?? []), ''])}
						className="text-sm text-blue-600 font-semibold text-left hover:text-blue-800 transition-colors"
					>
						+ Добавить фото
					</button>
				</div>
			</div>

			<div>
				<span className={lbl}>Документы и файлы</span>
				<div className="flex flex-col gap-2">
					{(form.files ?? [{ name: '', url: '' }]).map((f, idx) => (
						<div key={idx} className="flex gap-2">
							<input
								className={inp}
								value={f.name}
								onChange={(e) => setFile(idx, 'name', e.target.value)}
								placeholder="Название файла"
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
								className="px-3 py-2 rounded-xl border-2 border-red-200 text-red-500 text-sm hover:bg-red-50 transition-all shrink-0"
							>
								✕
							</button>
						</div>
					))}
					<button
						type="button"
						onClick={() => set('files', [...(form.files ?? []), { name: '', url: '' }])}
						className="text-sm text-blue-600 font-semibold text-left hover:text-blue-800 transition-colors"
					>
						+ Добавить файл
					</button>
				</div>
			</div>

			<div className="flex gap-2 pt-1">
				<button
					onClick={handleSave}
					disabled={saving || busy}
					className="flex-1 py-2 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-40"
				>
					{saving ? 'Сохранение...' : 'Сохранить'}
				</button>
				<button
					onClick={onCancel}
					disabled={saving || busy}
					className="flex-1 py-2 rounded-xl border-2 border-blue-200 text-blue-700 font-semibold text-sm hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-40"
				>
					Отмена
				</button>
			</div>
		</div>
	);
}

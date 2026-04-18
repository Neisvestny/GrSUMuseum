import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Rector } from '../api/rectors';
import { useRectors } from '../hooks/useRectors';

// ─── Пустой шаблон ───────────────────────────────────────────────────────────
const EMPTY_RECTOR: Omit<Rector, 'id' | 'position'> = {
	name: '',
	years: '',
	description: '',
	full_text: '',
	img: '',
	images: [],
	files: [],
};

// ─── Форма ───────────────────────────────────────────────────────────────────
function RectorForm({
	initial,
	onSave,
	onCancel,
	busy,
}: {
	initial: Partial<Rector>;
	onSave: (data: Partial<Rector>) => Promise<void>;
	onCancel: () => void;
	busy: boolean;
}) {
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
		} catch (e: any) {
			setErr(e?.message ?? 'Ошибка сохранения');
		} finally {
			setSaving(false);
		}
	};

	const inp =
		'w-full px-3 py-2 rounded-xl border-2 border-blue-200 bg-white text-gray-800 text-sm focus:outline-none focus:border-blue-500 transition-colors';
	const lbl = 'text-xs font-semibold text-blue-700 mb-1 block';

	return (
		<div className="flex flex-col gap-4">
			{err && (
				<div className="px-3 py-2 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 text-sm">
					{err}
				</div>
			)}

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
					className={inp + ' resize-none h-16'}
					value={form.description ?? ''}
					onChange={(e) => set('description', e.target.value)}
					placeholder="Для карточки на странице ректоров"
				/>
			</label>

			<label>
				<span className={lbl}>Полная биография</span>
				<textarea
					className={inp + ' resize-none h-28'}
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

			{/* Галерея */}
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

			{/* Файлы */}
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

// ─── Карточка ректора ─────────────────────────────────────────────────────────
function RectorCard({ rector, onChanged }: { rector: Rector; onChanged: () => void }) {
	const { update, remove } = useRectors();
	const [editing, setEditing] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const handleSave = async (data: Partial<Rector>) => {
		setBusy(true);
		try {
			await update(rector.id, data);
			setEditing(false);
			onChanged();
		} catch (e: any) {
			setErr(e?.message ?? 'Ошибка');
		} finally {
			setBusy(false);
		}
	};

	const handleDelete = async () => {
		setBusy(true);
		try {
			await remove(rector.id);
			onChanged();
		} catch (e: any) {
			setErr(e?.message ?? 'Ошибка удаления');
			setBusy(false);
		}
	};

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm overflow-hidden"
		>
			<div className="flex items-center gap-4 p-4">
				<div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border-2 border-blue-100 bg-blue-50">
					{rector.img ? (
						<img
							src={rector.img}
							alt={rector.name}
							className="w-full h-full object-cover"
							onError={(e) => {
								(e.target as HTMLImageElement).style.display = 'none';
							}}
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-blue-300 text-xl">
							👤
						</div>
					)}
				</div>

				<div className="w-8 h-8 shrink-0 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
					{rector.position}
				</div>

				<div className="flex-1 min-w-0">
					<div className="font-bold text-blue-800 text-sm truncate">
						{rector.name || '—'}
					</div>
					<div className="text-xs text-gray-500 truncate">{rector.years || '—'}</div>
				</div>

				<div className="flex gap-2 shrink-0">
					<button
						disabled={busy}
						onClick={() => {
							setEditing((v) => !v);
							setConfirmDelete(false);
							setErr(null);
						}}
						className="px-3 py-1.5 rounded-xl border-2 border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-40"
					>
						{editing ? 'Свернуть' : 'Изменить'}
					</button>

					{!confirmDelete ? (
						<button
							disabled={busy}
							onClick={() => setConfirmDelete(true)}
							className="px-3 py-1.5 rounded-xl border-2 border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 active:scale-95 transition-all disabled:opacity-40"
						>
							Удалить
						</button>
					) : (
						<div className="flex gap-1 items-center">
							<span className="text-red-500 text-xs font-semibold">Удалить?</span>
							<button
								onClick={handleDelete}
								disabled={busy}
								className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-40"
							>
								{busy ? '...' : 'Да'}
							</button>
							<button
								onClick={() => setConfirmDelete(false)}
								className="px-3 py-1.5 rounded-xl border-2 border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 active:scale-95 transition-all"
							>
								Нет
							</button>
						</div>
					)}
				</div>
			</div>

			{err && <div className="px-4 pb-2 text-red-500 text-xs font-semibold">{err}</div>}

			<AnimatePresence>
				{editing && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="px-4 pb-4 pt-4 border-t-2 border-blue-50">
							<RectorForm
								initial={rector}
								onSave={handleSave}
								onCancel={() => setEditing(false)}
								busy={busy}
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

// ─── Главный компонент ───────────────────────────────────────────────────────
export default function RectorsAdmin() {
	const navigate = useNavigate();
	const { rectors, loading, error, add, reload } = useRectors();
	const [adding, setAdding] = useState(false);
	const [busy, setBusy] = useState(false);
	const [addErr, setAddErr] = useState<string | null>(null);

	const handleAdd = async (data: Partial<Rector>) => {
		setBusy(true);
		setAddErr(null);
		try {
			await add(data);
			setAdding(false);
		} catch (e: any) {
			setAddErr(e?.message ?? 'Ошибка добавления');
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="relative w-screen h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col overflow-hidden">
			{/* Навбар */}
			<nav className="flex items-center gap-4 px-8 py-4 bg-white/80 backdrop-blur-md border-b border-blue-100 shrink-0 z-10">
				<button
					onClick={() => navigate(-1)}
					className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-blue-200 bg-white/80 hover:bg-blue-700 hover:text-white hover:border-blue-700 text-blue-700 font-semibold transition-all duration-200 active:scale-95"
				>
					<svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
						<path
							d="M15 10H5M5 10l5-5M5 10l5 5"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
					Назад
				</button>
				<div className="h-6 w-px bg-blue-200" />
				<h1 className="text-blue-700 font-bold text-xl">Управление ректорами</h1>
			</nav>

			<main className="flex-1 overflow-y-auto px-8 py-6 z-10">
				{/* Кнопка добавления */}
				<div className="mb-4 flex gap-3">
					<button
						onClick={() => {
							setAdding((v) => !v);
							setAddErr(null);
						}}
						disabled={busy}
						className="px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 active:scale-95 transition-all shadow-md disabled:opacity-40"
					>
						{adding ? '✕ Отмена' : '+ Добавить ректора'}
					</button>
				</div>

				{/* Форма добавления */}
				<AnimatePresence>
					{adding && (
						<motion.div
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4"
						>
							<p className="text-blue-700 font-bold text-sm mb-3">Новый ректор</p>
							{addErr && (
								<div className="mb-3 px-3 py-2 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 text-sm">
									{addErr}
								</div>
							)}
							<RectorForm
								initial={EMPTY_RECTOR}
								onSave={handleAdd}
								onCancel={() => {
									setAdding(false);
									setAddErr(null);
								}}
								busy={busy}
							/>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Состояния */}
				{loading && <div className="text-center text-blue-600 py-8">Загрузка...</div>}
				{error && <div className="text-center text-red-500 py-8">{error}</div>}

				{/* Список */}
				<div className="flex flex-col gap-3">
					<AnimatePresence>
						{rectors.map((r) => (
							<RectorCard key={r.id} rector={r} onChanged={reload} />
						))}
					</AnimatePresence>

					{!loading && rectors.length === 0 && (
						<div className="text-center text-gray-400 py-12 text-sm">
							Список пуст. Добавьте первого ректора.
						</div>
					)}
				</div>
			</main>
		</div>
	);
}

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Rector } from '../api/rectors';
import type { Teacher, TeacherMutation, TeacherSection } from '../api/teachers';
import { EMPTY_RECTOR } from '../components/features/admin/rectors/constants';
import RectorCard from '../components/features/admin/rectors/RectorCard';
import RectorForm from '../components/features/admin/rectors/RectorForm';
import { useRectors } from '../hooks/useRectors';
import { useTeachers } from '../hooks/useTeachers';

// ═══════════════════════════════════════════════════════════════
// РЕЕСТР СЕКЦИЙ — добавляй сюда новые разделы
// ═══════════════════════════════════════════════════════════════
const SECTIONS = [
	{ id: 'teachers-vov', label: 'Купаловцы помнят', sub: 'ВОВ', icon: '🎖️' },
	{
		id: 'teachers-afgan',
		label: 'Купаловцы помнят',
		sub: 'Афганистан',
		icon: '🕊️',
	},
	{
		id: 'teachers-olympic-coaches',
		label: 'Зал славы',
		sub: 'Тренера Олимпийцы',
		icon: '🏅',
	},
	{
		id: 'teachers-olympic-students',
		label: 'Зал славы',
		sub: 'Студенты Олимпийцы',
		icon: '🥇',
	},
	{
		id: 'teachers-trainer',
		label: 'Тренеры',
		sub: 'Спортивные тренеры',
		icon: '🏋️',
	},
	{ id: 'rectors', label: 'Ректоры ГрГУ', sub: '', icon: '🎓' },
	// { id: 'news', label: 'Новости', sub: '', icon: '📰' }, ← просто раскомментируй и добавь панель
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

// ═══════════════════════════════════════════════════════════════
// ОБЩИЕ UI-ПРИМИТИВЫ
// ═══════════════════════════════════════════════════════════════
const inp =
	'w-full px-3 py-2 rounded-xl border-2 border-blue-200 bg-white text-gray-800 text-sm focus:outline-none focus:border-blue-500 transition-colors';
const lbl = 'text-xs font-semibold text-blue-700 mb-1 block';

function ErrorBox({ msg }: { msg: string }) {
	return (
		<div className="px-3 py-2 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 text-sm">
			{msg}
		</div>
	);
}

function ConfirmDelete({
	onYes,
	onNo,
	busy,
}: {
	onYes: () => void;
	onNo: () => void;
	busy: boolean;
}) {
	return (
		<div className="flex gap-1 items-center">
			<span className="text-red-500 text-xs font-semibold">Удалить?</span>
			<button
				onClick={onYes}
				disabled={busy}
				className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-40"
			>
				{busy ? '...' : 'Да'}
			</button>
			<button
				onClick={onNo}
				className="px-3 py-1.5 rounded-xl border-2 border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 active:scale-95 transition-all"
			>
				Нет
			</button>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// ПАНЕЛЬ: ПРЕПОДАВАТЕЛИ (ВОВ / Афганистан)
// ═══════════════════════════════════════════════════════════════
function TeacherForm({
	initial,
	maxPos,
	onSave,
	onCancel,
	busy,
}: {
	initial: Partial<Teacher> & { id?: number; position?: number };
	maxPos: number;
	onSave: (data: TeacherMutation) => Promise<void>;
	onCancel: () => void;
	busy: boolean;
}) {
	const [form, setForm] = useState({
		position: String(initial.position ?? initial.id ?? ''),
		name: initial.name ?? '',
		role: initial.role ?? '',
		desc: initial.desc ?? '',
		img: initial.img ?? '',
	});
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const set =
		(k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			setForm((f) => ({ ...f, [k]: e.target.value }));

	const handleSave = async () => {
		setSaving(true);
		setErr(null);
		try {
			await onSave({
				name: form.name,
				role: form.role,
				desc: form.desc,
				img: form.img,
				position: form.position !== '' ? Number(form.position) : undefined,
			});
		} catch (error) {
			setErr(error instanceof Error ? error.message : 'Ошибка сохранения');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-3">
			{err && <ErrorBox msg={err} />}
			<label>
				<span className={lbl}>Позиция (1–{maxPos})</span>
				<input
					className={inp}
					value={form.position}
					onChange={set('position')}
					type="number"
					min={1}
					max={maxPos}
					placeholder="авто"
				/>
			</label>
			<label>
				<span className={lbl}>Имя</span>
				<input
					className={inp}
					value={form.name}
					onChange={set('name')}
					placeholder="Иванов Иван Иванович"
				/>
			</label>
			<label>
				<span className={lbl}>Должность</span>
				<input
					className={inp}
					value={form.role}
					onChange={set('role')}
					placeholder="Профессор кафедры математики"
				/>
			</label>
			<label>
				<span className={lbl}>Описание</span>
				<textarea
					className={inp + ' resize-none h-20'}
					value={form.desc}
					onChange={set('desc')}
					placeholder="Краткая биография..."
				/>
			</label>
			<label>
				<span className={lbl}>Фото (URL или путь)</span>
				<input
					className={inp}
					value={form.img}
					onChange={set('img')}
					placeholder="/images/teacher.jpg"
				/>
			</label>
			<div className="flex gap-2 mt-1">
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

function TeacherCard({
	teacher,
	section,
	maxId,
	onChanged,
}: {
	teacher: Teacher;
	section: TeacherSection;
	maxId: number;
	onChanged: () => void;
}) {
	const { update, remove } = useTeachers(section);
	const [editing, setEditing] = useState(false);
	const [confirmDel, setConfirmDel] = useState(false);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const handleSave = async (data: TeacherMutation) => {
		setBusy(true);
		try {
			await update(teacher.id, data);
			setEditing(false);
			onChanged();
		} catch (error) {
			setErr(error instanceof Error ? error.message : 'Ошибка');
		} finally {
			setBusy(false);
		}
	};

	const handleDelete = async () => {
		setBusy(true);
		try {
			await remove(teacher.id);
			onChanged();
		} catch (error) {
			setErr(error instanceof Error ? error.message : 'Ошибка удаления');
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
				<div className="w-10 h-10 shrink-0 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
					{teacher.id}
				</div>
				<div className="flex-1 min-w-0">
					<div className="font-bold text-blue-800 text-sm truncate">
						{teacher.name || '—'}
					</div>
					<div className="text-xs text-gray-500 truncate">{teacher.role || '—'}</div>
				</div>
				<div className="flex gap-2 shrink-0">
					<button
						disabled={busy}
						onClick={() => {
							setEditing((v) => !v);
							setConfirmDel(false);
							setErr(null);
						}}
						className="px-3 py-1.5 rounded-xl border-2 border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-40"
					>
						{editing ? 'Свернуть' : 'Изменить'}
					</button>
					{!confirmDel ? (
						<button
							disabled={busy}
							onClick={() => setConfirmDel(true)}
							className="px-3 py-1.5 rounded-xl border-2 border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 active:scale-95 transition-all disabled:opacity-40"
						>
							Удалить
						</button>
					) : (
						<ConfirmDelete
							onYes={handleDelete}
							onNo={() => setConfirmDel(false)}
							busy={busy}
						/>
					)}
				</div>
			</div>
			{err && (
				<div className="px-4 pb-2">
					<ErrorBox msg={err} />
				</div>
			)}
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
							<TeacherForm
								initial={teacher}
								maxPos={maxId}
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

function TeachersPanel({ section }: { section: TeacherSection }) {
	const { teachers, loading, error, add, reset, reload } = useTeachers(section);
	const [adding, setAdding] = useState(false);
	const [confirmReset, setConfirmReset] = useState(false);
	const [busy, setBusy] = useState(false);
	const [addErr, setAddErr] = useState<string | null>(null);

	const handleAdd = async (data: TeacherMutation) => {
		setBusy(true);
		setAddErr(null);
		try {
			await add(data);
			setAdding(false);
		} catch (error) {
			setAddErr(error instanceof Error ? error.message : 'Ошибка');
		} finally {
			setBusy(false);
		}
	};

	const handleReset = async () => {
		setBusy(true);
		await reset();
		setConfirmReset(false);
		setBusy(false);
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2 flex-wrap">
				<button
					onClick={() => {
						setAdding((v) => !v);
						setAddErr(null);
					}}
					disabled={busy}
					className="px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 active:scale-95 transition-all shadow-md disabled:opacity-40"
				>
					{adding ? '✕ Отмена' : '+ Добавить (с данными)'}
				</button>
				<button
					onClick={() => {
						setBusy(true);
						add({}).finally(() => setBusy(false));
					}}
					disabled={busy}
					className="px-4 py-2 rounded-xl border-2 border-blue-300 text-blue-700 font-semibold text-sm hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-40"
				>
					+ Быстрое добавление
				</button>
				<div className="flex-1" />
				{!confirmReset ? (
					<button
						onClick={() => setConfirmReset(true)}
						className="px-4 py-2 rounded-xl border-2 border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 active:scale-95 transition-all"
					>
						Сбросить к исходным
					</button>
				) : (
					<div className="flex gap-2 items-center">
						<span className="text-red-500 text-sm font-semibold">Вы уверены?</span>
						<button
							onClick={handleReset}
							className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 active:scale-95 transition-all"
						>
							Да
						</button>
						<button
							onClick={() => setConfirmReset(false)}
							className="px-3 py-1.5 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 active:scale-95 transition-all"
						>
							Нет
						</button>
					</div>
				)}
			</div>

			<AnimatePresence>
				{adding && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4"
					>
						<p className="text-blue-700 font-bold text-sm mb-3">Новый преподаватель</p>
						{addErr && (
							<div className="mb-3">
								<ErrorBox msg={addErr} />
							</div>
						)}
						<TeacherForm
							initial={{}}
							maxPos={teachers.length + 1}
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

			{loading && <div className="text-center text-blue-600 py-8">Загрузка...</div>}
			{error && <div className="text-center text-red-500 py-8">{error}</div>}

			<div className="flex flex-col gap-3">
				<AnimatePresence>
					{teachers.map((t) => (
						<TeacherCard
							key={t.id}
							teacher={t}
							section={section}
							maxId={teachers.length}
							onChanged={reload}
						/>
					))}
				</AnimatePresence>
				{!loading && teachers.length === 0 && (
					<div className="text-center text-gray-400 py-12 text-sm">
						Список пуст. Добавьте первого преподавателя.
					</div>
				)}
			</div>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// ПАНЕЛЬ: РЕКТОРЫ
// ═══════════════════════════════════════════════════════════════
function RectorsPanel() {
	const { rectors, loading, error, add, update, remove, reload } = useRectors();
	const [adding, setAdding] = useState(false);
	const [busy, setBusy] = useState(false);
	const [addErr, setAddErr] = useState<string | null>(null);

	const handleAdd = async (data: Partial<Rector>) => {
		setBusy(true);
		setAddErr(null);
		try {
			await add(data);
			setAdding(false);
		} catch (error) {
			setAddErr(error instanceof Error ? error.message : 'Ошибка');
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2">
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
			<AnimatePresence>
				{adding && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4"
					>
						<p className="text-blue-700 font-bold text-sm mb-3">Новый ректор</p>
						{addErr && (
							<div className="mb-3">
								<ErrorBox msg={addErr} />
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
			{loading && <div className="text-center text-blue-600 py-8">Загрузка...</div>}
			{error && <div className="text-center text-red-500 py-8">{error}</div>}
			<div className="flex flex-col gap-3">
				<AnimatePresence>
					{rectors.map((r) => (
						<RectorCard
							key={r.id}
							rector={r}
							onUpdate={update}
							onDelete={remove}
							onChanged={reload}
						/>
					))}
				</AnimatePresence>
				{!loading && rectors.length === 0 && (
					<div className="text-center text-gray-400 py-12 text-sm">
						Список пуст. Добавьте первого ректора.
					</div>
				)}
			</div>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// РОУТЕР ПАНЕЛЕЙ — добавляй новые секции сюда
// ═══════════════════════════════════════════════════════════════
function PanelRouter({ sectionId }: { sectionId: SectionId }) {
	switch (sectionId) {
		case 'teachers-vov':
			return <TeachersPanel section="vov" />;
		case 'teachers-afgan':
			return <TeachersPanel section="afgan" />;
		case 'teachers-olympic-coaches':
			return <TeachersPanel section="olympcoch" />;
		case 'teachers-olympic-students':
			return <TeachersPanel section="olympstud" />;
		case 'teachers-trainer':
			return <TeachersPanel section="trainer" />;
		case 'rectors':
			return <RectorsPanel />;
		// case 'news':        return <NewsPanel />;
		default:
			return null;
	}
}

// ═══════════════════════════════════════════════════════════════
// ГЛАВНЫЙ КОМПОНЕНТ
// ═══════════════════════════════════════════════════════════════
export default function AdminPanel() {
	const navigate = useNavigate();
	const [activeId, setActiveId] = useState<SectionId>(SECTIONS[0].id);

	return (
		<div className="relative w-screen h-screen bg-gradient-to-br from-blue-50 to-white flex overflow-hidden">
			{/* ── Боковая панель (сайдбар) ── */}
			<aside className="w-64 shrink-0 h-full flex flex-col bg-white/80 backdrop-blur-md border-r border-blue-100 z-10">
				<div className="px-6 py-5 border-b border-blue-100">
					<button
						onClick={() => navigate(-1)}
						className="flex items-center gap-2 text-blue-700 font-semibold text-sm hover:text-blue-900 transition-colors"
					>
						<svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
							<path
								d="M15 10H5M5 10l5-5M5 10l5 5"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
						На сайт
					</button>
					<h1 className="text-blue-800 font-bold text-lg mt-3 leading-tight">
						Админ-панель
					</h1>
					<p className="text-blue-400 text-xs mt-0.5">ГрГУ имени Янки Купалы</p>
				</div>

				<nav className="flex-1 overflow-y-auto py-4 px-3">
					<p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-3 mb-2">
						Разделы
					</p>
					<div className="flex flex-col gap-1">
						{SECTIONS.map((s) => {
							const isActive = s.id === activeId;
							return (
								<button
									key={s.id}
									onClick={() => setActiveId(s.id)}
									className={`
                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                                        transition-all duration-150 active:scale-95
                                        ${
											isActive
												? 'bg-blue-700 text-white shadow-md'
												: 'text-blue-800 hover:bg-blue-50'
										}
                                    `}
								>
									<span className="text-lg leading-none">{s.icon}</span>
									<div className="min-w-0">
										<div className="font-semibold text-sm truncate">
											{s.label}
										</div>
										{s.sub && (
											<div
												className={`text-xs truncate ${isActive ? 'text-blue-200' : 'text-gray-400'}`}
											>
												{s.sub}
											</div>
										)}
									</div>
									{isActive && (
										<div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shrink-0" />
									)}
								</button>
							);
						})}
					</div>
				</nav>
			</aside>

			{/* ── Основная область ── */}
			<main className="flex-1 flex flex-col overflow-hidden">
				{/* Хедер */}
				<header className="px-8 py-4 bg-white/60 backdrop-blur-md border-b border-blue-100 shrink-0 flex items-center gap-4">
					{(() => {
						const s = SECTIONS.find((s) => s.id === activeId)!;
						return (
							<>
								<span className="text-2xl">{s.icon}</span>
								<div>
									<h2 className="text-blue-800 font-bold text-lg leading-tight">
										{s.label}
									</h2>
									{s.sub && <p className="text-blue-400 text-xs">{s.sub}</p>}
								</div>
							</>
						);
					})()}
				</header>

				{/* Контент с анимацией при переключении */}
				<div className="flex-1 overflow-y-auto px-8 py-6">
					<AnimatePresence mode="wait">
						<motion.div
							key={activeId}
							initial={{ opacity: 0, x: 16 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -16 }}
							transition={{ duration: 0.18 }}
						>
							<PanelRouter sectionId={activeId} />
						</motion.div>
					</AnimatePresence>
				</div>
			</main>
		</div>
	);
}

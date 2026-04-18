import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Teacher } from '../api/teachers';
import { useTeachers } from '../hooks/useTeachers';

type Section = 'vov' | 'afgan';
const SECTION_LABELS: Record<Section, string> = {
	vov: 'ВОВ',
	afgan: 'Афганистан',
};

function TeacherForm({
	initial,
	maxId,
	onSave,
	onCancel,
}: {
	initial: Partial<Teacher> & { id?: number };
	maxId: number;
	onSave: (data: Partial<Teacher> & { position?: number }) => void;
	onCancel: () => void;
}) {
	const [form, setForm] = useState({
		id: String(initial.id ?? ''),
		name: initial.name ?? '',
		role: initial.role ?? '',
		desc: initial.desc ?? '',
		img: initial.img ?? '',
	});

	const set =
		(k: keyof typeof form) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			setForm((f) => ({ ...f, [k]: e.target.value }));

	const handleSave = () => {
		onSave({
			name: form.name,
			role: form.role,
			desc: form.desc,
			img: form.img,
			position: form.id !== '' ? Number(form.id) : undefined,
		});
	};

	const inputCls =
		'w-full px-3 py-2 rounded-xl border-2 border-blue-200 bg-white text-gray-800 text-sm focus:outline-none focus:border-blue-500 transition-colors';
	const labelCls = 'text-xs font-semibold text-blue-700 mb-1 block';

	return (
		<div className="flex flex-col gap-3">
			<label>
				<span className={labelCls}>Позиция (1–{maxId})</span>
				<input
					className={inputCls}
					value={form.id}
					onChange={set('id')}
					placeholder="авто"
					type="number"
					min={1}
					max={maxId}
				/>
			</label>
			<label>
				<span className={labelCls}>Имя</span>
				<input
					className={inputCls}
					value={form.name}
					onChange={set('name')}
					placeholder="Иванов Иван Иванович"
				/>
			</label>
			<label>
				<span className={labelCls}>Должность</span>
				<input
					className={inputCls}
					value={form.role}
					onChange={set('role')}
					placeholder="Профессор кафедры математики"
				/>
			</label>
			<label>
				<span className={labelCls}>Описание</span>
				<textarea
					className={inputCls + ' resize-none h-20'}
					value={form.desc}
					onChange={set('desc')}
					placeholder="Краткая биография..."
				/>
			</label>
			<label>
				<span className={labelCls}>Фото (URL или путь)</span>
				<input
					className={inputCls}
					value={form.img}
					onChange={set('img')}
					placeholder="/images/teacher.jpg"
				/>
			</label>
			<div className="flex gap-2 mt-1">
				<button
					onClick={handleSave}
					className="flex-1 py-2 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 active:scale-95 transition-all"
				>
					Сохранить
				</button>
				<button
					onClick={onCancel}
					className="flex-1 py-2 rounded-xl border-2 border-blue-200 text-blue-700 font-semibold text-sm hover:bg-blue-50 active:scale-95 transition-all"
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
	section: Section;
	maxId: number;
	onChanged: () => void;
}) {
	const { update, remove } = useTeachers(section);
	const [editing, setEditing] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [busy, setBusy] = useState(false);

	const handleSave = async (
		data: Partial<Teacher> & { position?: number },
	) => {
		setBusy(true);
		await update(teacher.id, { ...data, position: data.position });
		setEditing(false);
		setBusy(false);
		onChanged();
	};

	const handleDelete = async () => {
		setBusy(true);
		await remove(teacher.id);
		setBusy(false);
		onChanged();
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
					<div className="text-xs text-gray-500 truncate">
						{teacher.role || '—'}
					</div>
				</div>
				<div className="flex gap-2 shrink-0">
					<button
						disabled={busy}
						onClick={() => {
							setEditing((v) => !v);
							setConfirmDelete(false);
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
						<div className="flex gap-1">
							<button
								onClick={handleDelete}
								className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 active:scale-95 transition-all"
							>
								Да
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

			<AnimatePresence>
				{editing && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="px-4 pb-4 border-t-2 border-blue-50 pt-4">
							<TeacherForm
								initial={teacher}
								maxId={maxId}
								onSave={handleSave}
								onCancel={() => setEditing(false)}
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

function SectionPanel({ section }: { section: Section }) {
	const { teachers, loading, error, add, reset, reload } =
		useTeachers(section);
	const [adding, setAdding] = useState(false);
	const [confirmReset, setConfirmReset] = useState(false);
	const [busy, setBusy] = useState(false);

	const handleAdd = async (
		data: Partial<Teacher> & { position?: number },
	) => {
		setBusy(true);
		await add(data);
		setAdding(false);
		setBusy(false);
	};

	const handleQuickAdd = async () => {
		setBusy(true);
		await add({});
		setBusy(false);
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
					onClick={() => setAdding((v) => !v)}
					disabled={busy}
					className="px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 active:scale-95 transition-all shadow-md disabled:opacity-40"
				>
					{adding ? '✕ Отмена' : '+ Добавить (с данными)'}
				</button>
				<button
					onClick={handleQuickAdd}
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
						<span className="text-red-500 text-sm font-semibold">
							Вы уверены?
						</span>
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
						<p className="text-blue-700 font-bold text-sm mb-3">
							Новый преподаватель
						</p>
						<TeacherForm
							initial={{}}
							maxId={teachers.length + 1}
							onSave={handleAdd}
							onCancel={() => setAdding(false)}
						/>
					</motion.div>
				)}
			</AnimatePresence>

			{loading && (
				<div className="text-center text-blue-600 py-8">
					Загрузка...
				</div>
			)}
			{error && (
				<div className="text-center text-red-500 py-8">{error}</div>
			)}

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

export default function AdminPanel() {
	const navigate = useNavigate();
	const [activeSection, setActiveSection] = useState<Section>('vov');

	return (
		<div className="relative w-screen h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col overflow-hidden">
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
				<h1 className="text-blue-700 font-bold text-xl">
					Админ-панель
				</h1>
				<div className="flex-1" />
				<div className="flex gap-1 p-1 bg-blue-100 rounded-xl">
					{(Object.keys(SECTION_LABELS) as Section[]).map((s) => (
						<button
							key={s}
							onClick={() => setActiveSection(s)}
							className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-all duration-200 ${activeSection === s ? 'bg-blue-700 text-white shadow-md' : 'text-blue-700 hover:bg-blue-200'}`}
						>
							{SECTION_LABELS[s]}
						</button>
					))}
				</div>
			</nav>

			<main className="flex-1 overflow-y-auto px-8 py-6 z-10">
				<AnimatePresence mode="wait">
					<motion.div
						key={activeSection}
						initial={{ opacity: 0, x: 16 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -16 }}
						transition={{ duration: 0.2 }}
					>
						<SectionPanel section={activeSection} />
					</motion.div>
				</AnimatePresence>
			</main>
		</div>
	);
}

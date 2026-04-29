import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Rector } from '../api/rectors';
import { EMPTY_RECTOR } from '../components/features/admin/rectors/constants';
import RectorCard from '../components/features/admin/rectors/RectorCard';
import RectorForm from '../components/features/admin/rectors/RectorForm';
import TeachersPanel from '../components/features/admin/teachers/TeachersPanel';
import AdminButton from '../components/features/admin/ui/AdminButton';
import { ErrorBox } from '../components/features/admin/ui/ErrorBox';
import { useRectors } from '../hooks/useRectors';

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
				<AdminButton
					onClick={() => {
						setAdding((v) => !v);
						setAddErr(null);
					}}
					disabled={busy}
					variant="primary"
					size="md"
					className="shadow-md hover:shadow-lg"
				>
					{adding ? '✕ Отмена' : '+ Добавить ректора'}
				</AdminButton>
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
							// Важно: если на бэке `id`/позиции могут пересчитываться после удаления,
							// key по `id` даст React шанс переиспользовать карточку для другой записи,
							// и локальный UI-state ("Удалить? Да/Нет") может "переехать".
							// Делаем key стабильным по содержимому записи, а не по позиции/порядку.
							key={`rector:${r.name}:${r.years}:${r.img}:${r.description}:${r.full_text}`}
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

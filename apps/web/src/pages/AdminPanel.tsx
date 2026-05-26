import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilesPanel from '../components/features/admin/files/FilesPanel';
import MenuPanel from '../components/features/admin/menu/MenuPanel';
import PagesPanel from '../components/features/admin/pages/PagesPanel';
import PeoplePanel from '../components/features/admin/people/PeoplePanel';
import TaxonomyPanel from '../components/features/admin/taxonomy/TaxonomyPanel';
import { AdminToastProvider } from '../components/features/admin/ui/AdminToastContext';

const SECTIONS = [
	{ id: 'menu-cms', label: 'Меню разделов', sub: 'Навигация', icon: '🧭' },
	{ id: 'pages-cms', label: 'CMS страницы', sub: 'JSONB документ', icon: '🧩' },
	{ id: 'people', label: 'Люди', sub: 'Все персоны', icon: '👥' },
	{ id: 'taxonomy', label: 'Справочники', sub: 'Роли, теги, категории', icon: '🏷️' },
	{ id: 'media', label: 'Медиа', sub: 'Файлы, фото, видео', icon: '🗂️' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

function PanelRouter({ sectionId }: { sectionId: SectionId }) {
	switch (sectionId) {
		case 'people':
			return <PeoplePanel />;
		case 'taxonomy':
			return <TaxonomyPanel />;
		case 'media':
			return <FilesPanel />;
		case 'pages-cms':
			return <PagesPanel />;
		case 'menu-cms':
			return <MenuPanel />;
		default:
			return null;
	}
}

export default function AdminPanel() {
	const navigate = useNavigate();
	const [activeId, setActiveId] = useState<SectionId>(SECTIONS[0].id);

	return (
		<AdminToastProvider>
			<div className="relative w-screen h-screen bg-gradient-to-br from-blue-50 to-white flex overflow-hidden">
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

				<main className="flex-1 flex flex-col overflow-hidden">
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
		</AdminToastProvider>
	);
}

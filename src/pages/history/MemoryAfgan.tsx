import { AnimatePresence, motion } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import React, { useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useTeachers } from '../../hooks/useTeachers';
import MainLayout from '../../layouts/MainLayout';

// Указываем путь к воркеру pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url,
).toString();

// ─────────────────────────────────────────
// Вкладка 1: Преподаватели
// ─────────────────────────────────────────
function TeachersTab({ section }: { section: 'vov' | 'afgan' }) {
	const { teachers, loading, error } = useTeachers(section);
	const [active, setActive] = useState<number | null>(null);

	const current = teachers.find((t) => t.id === (active ?? teachers[0]?.id));

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center text-blue-600">
				<div className="text-lg font-medium">Загрузка...</div>
			</div>
		);
	}

	if (error) {
		return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>;
	}

	if (!teachers.length) {
		return (
			<div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
				Преподаватели не добавлены
			</div>
		);
	}

	return (
		<>
			<style>{`
        .teachers-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .teachers-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .teachers-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(147, 197, 253, 0.7) 25%,
            rgba(96, 165, 250, 0.85) 50%,
            rgba(147, 197, 253, 0.7) 75%,
            transparent 100%
          );
          border-radius: 999px;
        }
      `}</style>

			<div className="flex gap-6" style={{ height: 'calc(100vh - 220px)' }}>
				{/* Боковая панель */}
				<div className="flex flex-col gap-3 w-64 shrink-0 overflow-y-auto teachers-scroll pr-3 mr-1">
					{teachers.map((t) => {
						const isActive = t.id === (active ?? teachers[0]?.id);
						return (
							<button
								key={t.id}
								onClick={() => setActive(t.id)}
								className={`
                  text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 active:scale-95 shrink-0
                  ${
						isActive
							? 'bg-blue-700 border-blue-700 text-white shadow-lg'
							: 'bg-white/80 border-blue-200 text-blue-800 hover:border-blue-400 hover:bg-white'
					}
                `}
							>
								<div className="font-semibold text-sm">{t.name}</div>
								<div
									className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}
								>
									{t.role}
								</div>
							</button>
						);
					})}
				</div>

				{/* Карточка преподавателя */}
				<div className="flex-1 overflow-hidden">
					<AnimatePresence mode="wait">
						{current && (
							<motion.div
								key={current.id}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.25, ease: 'easeOut' }}
								className="h-full flex gap-8 bg-white/70 backdrop-blur-md rounded-2xl border-2 border-blue-100 p-8 shadow-sm"
							>
								{/* Фото — прибито к верхнему левому углу */}
								<div className="w-56 h-64 shrink-0 self-start rounded-xl overflow-hidden border-2 border-blue-100 bg-blue-50">
									<img
										src={current.img}
										alt={current.name}
										className="w-full h-full object-cover"
										onError={(e) => {
											(e.target as HTMLImageElement).src =
												'https://placehold.co/224x256/dbeafe/1e40af?text=Фото';
										}}
									/>
								</div>

								{/* Текст */}
								<div className="flex flex-col overflow-y-auto">
									<h2 className="text-blue-700 font-bold text-2xl mb-1">
										{current.name}
									</h2>
									<p className="text-blue-500 font-medium text-sm mb-4">
										{current.role}
									</p>
									<p className="text-gray-600 text-lg leading-relaxed">
										{current.desc}
									</p>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</>
	);
}

// ─────────────────────────────────────────
// Вкладка 2: Книжный PDF ридер
// ─────────────────────────────────────────
// Страница для flipbook — обязательно forwardRef
const DB_NAME = 'book-cache';
const DB_STORE = 'pages';
const DB_KEY = 'book.pdf';

async function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

async function getCached(): Promise<string[] | null> {
	const db = await openDb();
	return new Promise((resolve) => {
		const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(DB_KEY);
		req.onsuccess = () => resolve(req.result ?? null);
		req.onerror = () => resolve(null);
	});
}

async function saveCache(pages: string[]): Promise<void> {
	const db = await openDb();
	return new Promise((resolve) => {
		const req = db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).put(pages, DB_KEY);
		req.onsuccess = () => resolve();
		req.onerror = () => resolve();
	});
}

const FlipPage = React.forwardRef<HTMLDivElement, { src: string; pageNum: number }>(
	({ src, pageNum }, ref) => (
		<div ref={ref} className="bg-amber-50 border border-amber-200 overflow-hidden">
			<img src={src} alt={`Страница ${pageNum}`} className="w-full h-full object-contain" />
		</div>
	),
);
FlipPage.displayName = 'FlipPage';

const CoverPage = React.forwardRef<HTMLDivElement, Record<string, never>>((_, ref) => (
	<div
		ref={ref}
		className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-centert"
	>
		<div className="text-center text-white px-8">
			<div className="text-6xl mb-4">📖</div>
			<h3 className="font-bold text-xl leading-snug">Война в Афганистане</h3>
			<p className="text-blue-300 text-sm mt-2">Архивный документ</p>
		</div>
	</div>
));
CoverPage.displayName = 'CoverPage';

const PDF_PATH = '/book.pdf';
const SCALE = 1.4;

function BookReader() {
	const [pages, setPages] = useState<string[]>([]); // dataURL для каждой страницы
	const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
	const [progress, setProgress] = useState({ loaded: 0, total: 0 });
	const [currentPage, setCurrentPage] = useState(0);
	const bookRef = useRef<any>(null);

	useEffect(() => {
		(async () => {
			try {
				// Пробуем взять из кэша
				const cached = await getCached();
				if (cached) {
					setPages(cached);
					setProgress({
						loaded: cached.length,
						total: cached.length,
					});
					setStatus('ready');
					return;
				}

				// Иначе рендерим из PDF
				const doc = await pdfjsLib.getDocument(PDF_PATH).promise;
				const total = doc.numPages;
				const dataUrls: string[] = [];

				for (let i = 1; i <= total; i++) {
					const page = await doc.getPage(i);
					const viewport = page.getViewport({ scale: SCALE });
					const canvas = document.createElement('canvas');
					canvas.width = viewport.width;
					canvas.height = viewport.height;
					const ctx = canvas.getContext('2d')!;
					await page.render({ canvasContext: ctx, viewport, canvas }).promise;
					dataUrls.push(canvas.toDataURL());
					setProgress({ loaded: i, total });
				}

				// Сохраняем в кэш
				await saveCache(dataUrls);

				setPages(dataUrls);
				setStatus('ready');
			} catch {
				setStatus('error');
			}
		})();
	}, []);

	if (status === 'loading') {
		const pct = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;

		return (
			<div className="flex-1 flex items-center justify-center text-blue-600">
				<div className="flex flex-col items-center gap-4 w-72">
					<div className="text-lg font-medium">Загрузка документа…</div>

					{/* Прогресс бар */}
					<div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
						<div
							className="h-full bg-blue-700 rounded-full transition-all duration-300"
							style={{ width: `${pct}%` }}
						/>
					</div>

					<div className="text-sm text-blue-500">
						{progress.total > 0
							? `${progress.loaded} / ${progress.total} стр. · ${pct}%`
							: 'Открываем файл…'}
					</div>
				</div>
			</div>
		);
	}

	if (status === 'error') {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-red-700 text-center max-w-md">
					<div className="text-4xl mb-3">⚠️</div>
					<p className="font-semibold">
						Не удалось загрузить PDF. Убедитесь что файл лежит в public/book.pdf
					</p>
				</div>
			</div>
		);
	}

	const totalPages = pages.length;

	return (
		<div className="flex-1 flex flex-col items-center gap-4 select-none min-h-0">
			<div className="flex-1 flex items-center justify-center w-full min-h-0">
				{/* @ts-expect-error просто ошибка тупая*/}
				<HTMLFlipBook
					ref={bookRef}
					width={500}
					height={680}
					size="fixed"
					minWidth={500}
					maxWidth={500}
					minHeight={680}
					maxHeight={680}
					showCover={false}
					flippingTime={700}
					style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
					className="rounded-lg overflow-hidden"
					onFlip={(e: any) => setCurrentPage(e.data)}
					drawShadow={true}
					usePortrait={false}
					startPage={0}
					autoSize={false}
					maxShadowOpacity={0.5}
					mobileScrollSupport={true}
					clickEventForward={true}
					useMouseEvents={true}
					swipeDistance={30}
					showPageCorners={true}
					disableFlipByClick={false}
				>
					{/* Обложка — single page, правая сторона */}
					<CoverPage />

					{/* Страницы PDF */}
					{pages.map((src, i) => (
						<FlipPage key={i} src={src} pageNum={i + 1} />
					))}
				</HTMLFlipBook>
			</div>

			{/* Навигация */}
			<div className="flex items-center gap-6 pb-2">
				<button
					onClick={() => bookRef.current?.pageFlip().flipPrev()}
					disabled={currentPage === 0}
					className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center text-xl shadow-lg hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
				>
					‹
				</button>
				<span className="text-blue-700 font-medium text-sm min-w-48 text-center">
					{currentPage === 0
						? `Обложка · всего ${totalPages} стр.`
						: `Стр. ${currentPage} из ${totalPages}`}
				</span>
				<button
					onClick={() => bookRef.current?.pageFlip().flipNext()}
					disabled={currentPage >= totalPages}
					className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center text-xl shadow-lg hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
				>
					›
				</button>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────
// Главный компонент
// ─────────────────────────────────────────

const TABS = [
	{ id: 'teachers', label: 'Преподаватели войны' },
	{ id: 'book', label: 'Война в Афганистане' },
];

export default function MemoryAfgan() {
	const [activeTab, setActiveTab] = useState(TABS[0].id);

	return (
		<MainLayout title="Война в Афганистане">
			{/* Таб-бар */}
			<div className="relative z-10 flex items-center gap-3 mb-6">
				{TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`
							flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm text-center
							transition-all duration-200 active:scale-95
							${
								activeTab === tab.id
									? 'bg-blue-700 border-blue-700 text-white shadow-lg'
									: 'bg-white/80 border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-white'
							}
						`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Контент */}
			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -12 }}
					transition={{ duration: 0.2 }}
					className="flex-1 flex flex-col min-h-0"
				>
					{activeTab === 'teachers' ? <TeachersTab section="afgan" /> : <BookReader />}
				</motion.div>
			</AnimatePresence>
		</MainLayout>
	);
}

import { AnimatePresence, motion } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import React, { useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { PeopleRoleSlug } from '../../../lib/people-roles';
import { personToEntityItem } from '../../../lib/person-display';
import { usePeopleByRole } from '../../../hooks/usePeople';
import MainLayout from '../../../layouts/MainLayout';
import { SurfaceCard } from '../../design-system/Card';
import TabsBar from '../../design-system/TabsBar';
import EntityListDetail from '../../patterns/EntityListDetail';
import { getCachedPages, PDF_SCALE, saveCachedPages } from './lib/pdf-cache';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url,
).toString();

type Props = {
	pageTitle: string;
	bookTabLabel: string;
	peopleRole: PeopleRoleSlug;
	coverTitle: string;
	pdfPath: string;
};

function TeachersTab({ role }: { role: PeopleRoleSlug }) {
	const { people, loading, error } = usePeopleByRole(role);
	return (
		<EntityListDetail
			items={people.map(personToEntityItem)}
			loading={loading}
			error={error}
			emptyText="Преподаватели не добавлены"
		/>
	);
}

const FlipPage = React.forwardRef<HTMLDivElement, { src: string; pageNum: number }>(
	({ src, pageNum }, ref) => (
		<div ref={ref} className="bg-amber-50 border border-amber-200 overflow-hidden">
			<img src={src} alt={`Страница ${pageNum}`} className="w-full h-full object-contain" />
		</div>
	),
);
FlipPage.displayName = 'FlipPage';

const CoverPage = React.forwardRef<HTMLDivElement, { title: string }>(({ title }, ref) => (
	<div
		ref={ref}
		className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center"
	>
		<div className="text-center text-white px-8">
			<div className="text-6xl mb-4">📖</div>
			<h3 className="font-bold text-xl leading-snug">{title}</h3>
			<p className="text-blue-300 text-sm mt-2">Архивный документ</p>
		</div>
	</div>
));
CoverPage.displayName = 'CoverPage';

function BookReader({ coverTitle, pdfPath }: { coverTitle: string; pdfPath: string }) {
	const [pages, setPages] = useState<string[]>([]);
	const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
	const [progress, setProgress] = useState({ loaded: 0, total: 0 });
	const [currentPage, setCurrentPage] = useState(0);
	const bookRef = useRef<PageFlipBridge | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const cached = await getCachedPages(pdfPath);
				if (cached) {
					setPages(cached);
					setProgress({ loaded: cached.length, total: cached.length });
					setStatus('ready');
					return;
				}

				const doc = await pdfjsLib.getDocument(pdfPath).promise;
				const total = doc.numPages;
				const dataUrls: string[] = [];

				for (let i = 1; i <= total; i++) {
					const page = await doc.getPage(i);
					const viewport = page.getViewport({ scale: PDF_SCALE });
					const canvas = document.createElement('canvas');
					canvas.width = viewport.width;
					canvas.height = viewport.height;
					const ctx = canvas.getContext('2d')!;
					await page.render({ canvasContext: ctx, viewport, canvas }).promise;
					dataUrls.push(canvas.toDataURL());
					setProgress({ loaded: i, total });
				}

				await saveCachedPages(pdfPath, dataUrls);
				setPages(dataUrls);
				setStatus('ready');
			} catch {
				setStatus('error');
			}
		})();
	}, [pdfPath]);

	if (status === 'loading') {
		const pct = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;
		return (
			<div className="flex-1 flex items-center justify-center text-blue-600">
				<div className="flex flex-col items-center gap-4 w-72">
					<div className="text-lg font-medium">Загрузка документа…</div>
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
						Не удалось загрузить PDF. Убедитесь, что файл лежит в public{pdfPath}
					</p>
				</div>
			</div>
		);
	}

	const totalPages = pages.length;

	return (
		<div className="flex-1 flex flex-col items-center gap-4 select-none min-h-0">
			<div className="flex-1 flex items-center justify-center w-full min-h-0">
				<HTMLFlipBook
					ref={bookRef as unknown as React.RefObject<unknown>}
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
					onFlip={(event: unknown) =>
						setCurrentPage(
							typeof event === 'object' &&
								event !== null &&
								'data' in event &&
								typeof (event as { data: unknown }).data === 'number'
								? (event as { data: number }).data
								: 0,
						)
					}
					drawShadow={true}
					usePortrait={false}
					startZIndex={1}
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
					<CoverPage title={coverTitle} />
					{pages.map((src, i) => (
						<FlipPage key={i} src={src} pageNum={i + 1} />
					))}
				</HTMLFlipBook>
			</div>

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

type PageFlipBridge = {
	pageFlip: () => {
		flipPrev: () => void;
		flipNext: () => void;
	};
};

export default function MemoryWarPage({
	pageTitle,
	bookTabLabel,
	peopleRole,
	coverTitle,
	pdfPath,
}: Props) {
	const tabs = [
		{ id: 'teachers', label: 'Преподаватели войны' },
		{ id: 'book', label: bookTabLabel },
	] as const;
	const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('teachers');

	return (
		<MainLayout title={pageTitle}>
			<TabsBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -12 }}
					transition={{ duration: 0.2 }}
					className="flex-1 flex flex-col min-h-0"
				>
					{activeTab === 'teachers' ? (
						<TeachersTab role={peopleRole} />
					) : (
						<SurfaceCard className="h-full p-8">
							<BookReader coverTitle={coverTitle} pdfPath={pdfPath} />
						</SurfaceCard>
					)}
				</motion.div>
			</AnimatePresence>
		</MainLayout>
	);
}

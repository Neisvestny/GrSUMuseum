import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import MainLayout from '../layouts/MainLayout';

// ─── Типы ───────────────────────────────
interface Photo {
	id: number;
	src: string;
	title: string;
	annotation: string;
	year: number;
}

interface YearBlock {
	year: number;
	photos: Photo[];
}

const PHOTOS: Photo[] = [
	{
		id: 1,
		year: 1940,
		src: '/gallery/1940-1.jpg',
		title: 'Главный корпус университета',
		annotation:
			'Торжественный вид главного здания перед началом учебного года. Студенты собираются на ступенях.',
	},
	{
		id: 2,
		year: 1940,
		src: '/gallery/1940-2.jpg',
		title: 'Лекция по физике',
		annotation: 'Профессор Николаев ведёт занятие в аудитории №12. Полный зал студентов.',
	},
	{
		id: 3,
		year: 1940,
		src: '/gallery/1940-3.jpg',
		title: 'Студенческий актив',
		annotation: 'Заседание комсомольского бюро факультета математики и естественных наук.',
	},
	{
		id: 4,
		year: 1941,
		src: '/gallery/1941-1.jpg',
		title: 'Последний мирный день',
		annotation:
			'21 июня 1941 года. Выпускной вечер. Никто ещё не знал, что завтра всё изменится.',
	},
	{
		id: 5,
		year: 1941,
		src: '/gallery/1941-2.jpg',
		title: 'Уходят на фронт',
		annotation:
			'Студенты и преподаватели добровольцами уходят защищать Родину. Проводы у стен университета.',
	},

	{
		id: 4,
		year: 1941,
		src: '/gallery/1941-1.jpg',
		title: 'Последний мирный день',
		annotation:
			'21 июня 1941 года. Выпускной вечер. Никто ещё не знал, что завтра всё изменится.',
	},
	{
		id: 5,
		year: 1941,
		src: '/gallery/1941-2.jpg',
		title: 'Уходят на фронт',
		annotation:
			'Студенты и преподаватели добровольцами уходят защищать Родину. Проводы у стен университета.',
	},
	{
		id: 6,
		year: 1944,
		src: '/gallery/1944-1.jpg',
		title: 'Возвращение в Гродно',
		annotation:
			'Июль 1944. Советские войска освобождают город. Начинается восстановление университета.',
	},
	{
		id: 7,
		year: 1944,
		src: '/gallery/1944-2.jpg',
		title: 'Первые послевоенные занятия',
		annotation:
			'Осень 1944. Несмотря на разрушения, учебный процесс возобновлён в уцелевших зданиях.',
	},
	{
		id: 8,
		year: 1944,
		src: '/gallery/1944-3.jpg',
		title: 'Восстановительные работы',
		annotation: 'Студенты и преподаватели участвуют в восстановлении учебных корпусов.',
	},
	{
		id: 9,
		year: 1945,
		src: '/gallery/1945-1.jpg',
		title: 'День Победы',
		annotation: '9 мая 1945. Ликование на площади перед университетом. Слёзы радости и горя.',
	},
	{
		id: 10,
		year: 1945,
		src: '/gallery/1945-2.jpg',
		title: 'Возвращение героев',
		annotation:
			'Преподаватели-ветераны возвращаются к мирной жизни и продолжают научную деятельность.',
	},
	{
		id: 11,
		year: 1945,
		src: '/gallery/1945-3.jpg',
		title: 'Памятный митинг',
		annotation: 'Торжественное собрание в честь Победы. Минута молчания по погибшим коллегам.',
	},
	{
		id: 12,
		year: 1945,
		src: '/gallery/1945-4.jpg',
		title: 'Новый учебный год',
		annotation: 'Сентябрь 1945. Первый послевоенный набор студентов. Жизнь продолжается.',
	},
];

function groupByYear(photos: Photo[]): YearBlock[] {
	const map = new Map<number, Photo[]>();

	for (const photo of photos) {
		if (!map.has(photo.year)) map.set(photo.year, []);
		map.get(photo.year)!.push(photo);
	}

	return Array.from(map.entries())
		.sort(([a], [b]) => a - b)
		.map(([year, photos]) => ({ year, photos }));
}

// ─── Лайтбокс ───────────────────────────
function Lightbox({ photo, year, onClose }: { photo: Photo; year: number; onClose: () => void }) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.25 }}
			className="fixed inset-0 z-50 flex items-center justify-center"
			onClick={onClose}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm" />

			<motion.div
				initial={{ scale: 0.92, opacity: 0, y: 20 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.94, opacity: 0, y: 10 }}
				transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
				className="relative z-10 max-w-3xl w-full mx-6 bg-stone-900 border border-stone-700/60 shadow-2xl"
				onClick={(e) => e.stopPropagation()}
				style={{
					boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.8)',
				}}
			>
				{/* Фото */}
				<div
					className="relative bg-stone-950 overflow-hidden"
					style={{ aspectRatio: '4/3' }}
				>
					<img
						src={photo.src}
						alt={photo.title}
						loading="lazy"
						className="w-full h-full object-cover"
						style={{ filter: 'sepia(0.3) contrast(1.05)' }}
						onError={(e) => {
							(e.target as HTMLImageElement).src =
								`https://placehold.co/800x600/292524/a8a29e?text=${year}`;
						}}
					/>
					{/* Зернистость */}
					<div
						className="absolute inset-0 pointer-events-none opacity-30"
						style={{
							backgroundImage:
								"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
							backgroundSize: '128px 128px',
						}}
					/>
					{/* Виньетка */}
					<div
						className="absolute inset-0 pointer-events-none"
						style={{
							background:
								'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
						}}
					/>
					{/* Год */}
					<div className="absolute top-4 left-4 px-3 py-1 bg-stone-950/70 border border-stone-600/40 text-stone-400 text-xs tracking-[0.2em] font-mono">
						{year}
					</div>
					{/* Закрыть */}
					<button
						onClick={onClose}
						className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-stone-950/70 border border-stone-600/40 text-stone-400 hover:text-white hover:bg-stone-800 transition-all text-lg leading-none"
					>
						×
					</button>
				</div>

				{/* Подпись */}
				<div className="p-6 border-t border-stone-700/40">
					<div className="flex items-start gap-3">
						<div className="w-px self-stretch bg-amber-700/60 shrink-0 mt-1" />
						<div>
							<h3
								className="text-stone-100 font-semibold text-lg mb-2 leading-snug"
								style={{ fontFamily: 'Georgia, serif' }}
							>
								{photo.title}
							</h3>
							<p className="text-stone-400 text-sm leading-relaxed">
								{photo.annotation}
							</p>
						</div>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}

// ─── Карточка фото ──────────────────────
function PhotoCard({
	photo,
	year,
	index,
	onClick,
}: {
	photo: Photo;
	year: number;
	index: number;
	onClick: () => void;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.5,
				delay: index * 0.07,
				ease: [0.4, 0, 0.2, 1],
			}}
			onClick={onClick}
			className="group cursor-pointer flex flex-col bg-stone-900 border border-stone-700/50 hover:border-amber-700/50 transition-all duration-300"
			style={{
				boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
			}}
		>
			{/* Фото */}
			<div className="relative overflow-hidden bg-stone-950" style={{ aspectRatio: '4/3' }}>
				<img
					src={photo.src}
					alt={photo.title}
					loading="lazy"
					className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
					style={{
						filter: 'sepia(0.4) contrast(1.08) brightness(0.9)',
					}}
					onError={(e) => {
						(e.target as HTMLImageElement).src =
							`https://placehold.co/400x300/292524/78716c?text=${year}`;
					}}
				/>
				{/* Зернистость */}
				<div
					className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay"
					style={{
						backgroundImage:
							"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
						backgroundSize: '96px 96px',
					}}
				/>
				{/* Виньетка */}
				<div
					className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-60 group-hover:opacity-30"
					style={{
						background:
							'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
					}}
				/>
				{/* Hover оверлей */}
				<div className="absolute inset-0 bg-amber-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
				{/* Иконка увеличения */}
				<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
					<div className="w-10 h-10 border border-amber-500/60 flex items-center justify-center text-amber-400 text-xl bg-stone-950/60">
						+
					</div>
				</div>
			</div>

			{/* Текст */}
			<div className="p-4 flex-1 flex flex-col gap-2">
				<h4
					className="text-stone-200 font-semibold text-sm leading-snug group-hover:text-amber-200 transition-colors duration-200"
					style={{ fontFamily: 'Georgia, serif' }}
				>
					{photo.title}
				</h4>
				<p className="text-stone-500 text-xs leading-relaxed line-clamp-2">
					{photo.annotation}
				</p>
			</div>
		</motion.div>
	);
}

// ─── Блок года ──────────────────────────
function YearSection({ block, globalIndex }: { block: YearBlock; globalIndex: number }) {
	const [selected, setSelected] = useState<Photo | null>(null);

	return (
		<>
			<AnimatePresence>
				{selected && (
					<Lightbox
						photo={selected}
						year={block.year}
						onClose={() => setSelected(null)}
					/>
				)}
			</AnimatePresence>

			<motion.section
				initial={{ opacity: 0, y: 32 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					duration: 0.6,
					delay: globalIndex * 0.1,
					ease: [0.4, 0, 0.2, 1],
				}}
				className="mb-14"
			>
				{/* Заголовок года */}
				<div className="flex items-center gap-5 mb-7">
					<div className="flex items-baseline gap-3">
						<span
							className="text-6xl font-black text-stone-800 leading-none select-none"
							style={{
								fontFamily: 'Georgia, serif',
								letterSpacing: '-0.03em',
							}}
						>
							{block.year}
						</span>
						{/* <span
							className="text-amber-600/80 text-sm tracking-[0.25em] uppercase font-medium"
							style={{ fontFamily: 'Georgia, serif' }}
						>
							{block.year}е годы
						</span> */}
					</div>
					<div className="flex-1 h-px bg-gradient-to-r from-stone-700/60 to-transparent" />
					<span className="text-stone-600 text-xs font-mono tracking-wider">
						{block.photos.length} фото
					</span>
				</div>

				{/* Сетка фотографий */}
				<div className="grid grid-cols-3 gap-4">
					{block.photos.map((photo, i) => (
						<PhotoCard
							key={photo.id}
							photo={photo}
							year={block.year}
							index={i}
							onClick={() => setSelected(photo)}
						/>
					))}
				</div>
			</motion.section>
		</>
	);
}

// ─── Главный компонент ──────────────────
export default function PhotoGallery() {
	const gallery = groupByYear(PHOTOS);

	return (
		<MainLayout title="Фотогалерея">
			<div className="mb-8 flex items-center gap-4">
				<div className="h-px flex-1 bg-gradient-to-r from-transparent to-stone-700/40" />
				<p
					className="text-stone-500 text-xs tracking-[0.3em] uppercase"
					style={{ fontFamily: 'Georgia, serif' }}
				>
					Архив · {PHOTOS.length} фотографий
				</p>
				<div className="h-px flex-1 bg-gradient-to-l from-transparent to-stone-700/40" />
			</div>

			<div className="overflow-y-auto flex-1 pr-1">
				{gallery.map((block, i) => (
					<YearSection key={block.year} block={block} globalIndex={i} />
				))}
			</div>
		</MainLayout>
	);
}

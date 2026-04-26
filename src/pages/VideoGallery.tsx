import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { VIDEOS, type VideoItem } from '../features/gallery/data/videos';
import MainLayout from '../layouts/MainLayout';

// ─── Типы ───────────────────────────────

// ─── Утилиты ────────────────────────────
function getYoutubeId(url: string): string | null {
	const match = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
	);
	return match ? match[1] : null;
}

function getEmbedUrl(src: string): string | null {
	const ytId = getYoutubeId(src);
	if (ytId) return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
	const vimeoMatch = src.match(/vimeo\.com\/(\d+)/);
	if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
	return null;
}

function getThumbnail(src: string): string | null {
	const ytId = getYoutubeId(src);
	return ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
}

function getAllTags(videos: VideoItem[]): string[] {
	const set = new Set<string>();
	for (const v of videos) v.tags.forEach((t) => set.add(t));
	return ['Все', ...Array.from(set).sort()];
}

// ─── Модальное окно ──────────────────────
function VideoModal({ video, onClose }: { video: VideoItem; onClose: () => void }) {
	const embedUrl = getEmbedUrl(video.src);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [onClose]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
			className="fixed inset-0 z-50 flex items-center justify-center"
			style={{ backgroundColor: 'rgba(1, 15, 50, 0.85)' }}
			onClick={onClose}
		>
			<motion.div
				initial={{ scale: 0.95, opacity: 0, y: 16 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.97, opacity: 0, y: 8 }}
				transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
				className="relative z-10 w-full max-w-4xl mx-6"
				style={{
					background: '#ffffff',
					borderRadius: '20px',
					border: '2px solid #bfdbfe',
					boxShadow:
						'0 32px 80px rgba(30, 80, 200, 0.25), 0 0 0 1px rgba(255,255,255,0.6)',
					overflow: 'hidden',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Видео */}
				<div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
					{embedUrl ? (
						<iframe
							src={embedUrl}
							className="w-full h-full"
							allow="autoplay; fullscreen; picture-in-picture"
							allowFullScreen
							style={{ border: 'none', display: 'block' }}
						/>
					) : (
						<video src={video.src} className="w-full h-full" controls autoPlay />
					)}
					<button
						onClick={onClose}
						className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-xl leading-none transition-all duration-150 z-10"
						style={{
							background: 'rgba(255,255,255,0.18)',
							border: '1.5px solid rgba(255,255,255,0.35)',
							borderRadius: '50%',
							color: '#fff',
							backdropFilter: 'blur(4px)',
						}}
					>
						×
					</button>
				</div>

				{/* Инфо */}
				<div
					className="p-6"
					style={{
						background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
						borderTop: '2px solid #dbeafe',
					}}
				>
					<div className="flex items-start justify-between gap-5">
						<div className="flex-1 min-w-0">
							<h3
								className="font-bold text-xl leading-snug mb-1.5"
								style={{
									color: '#1e3a8a',
									fontFamily: 'Georgia, serif',
								}}
							>
								{video.title}
							</h3>
							<p className="text-sm leading-relaxed" style={{ color: '#4b6fa8' }}>
								{video.description}
							</p>
						</div>
						<div className="flex flex-wrap gap-1.5 shrink-0">
							{video.tags.map((tag) => (
								<span
									key={tag}
									className="px-3 py-1 text-xs font-semibold"
									style={{
										color: '#1d4ed8',
										border: '1.5px solid #bfdbfe',
										background: '#eff6ff',
										borderRadius: '999px',
									}}
								>
									{tag}
								</span>
							))}
						</div>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}

// ─── Карточка видео ─────────────────────
function VideoCard({
	video,
	index,
	onClick,
}: {
	video: VideoItem;
	index: number;
	onClick: () => void;
}) {
	const [hovered, setHovered] = useState(false);
	const thumbnailSrc = getThumbnail(video.src);

	return (
		<motion.div
			initial={{ opacity: 0, y: 18 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.38,
				delay: index * 0.07,
				ease: [0.4, 0, 0.2, 1],
			}}
			onClick={onClick}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			className="group cursor-pointer flex flex-col"
			style={{
				background: '#ffffff',
				borderRadius: '16px',
				border: hovered ? '2px solid #93c5fd' : '2px solid #dbeafe',
				boxShadow: hovered
					? '0 8px 32px rgba(30, 80, 220, 0.15), 0 2px 8px rgba(30,80,220,0.08)'
					: '0 2px 12px rgba(30, 80, 200, 0.06)',
				transition: 'border-color 0.2s, box-shadow 0.2s',
				overflow: 'hidden',
			}}
		>
			{/* Превью */}
			<div
				className="relative overflow-hidden"
				style={{
					aspectRatio: '16/9',
					background: '#dbeafe',
					flexShrink: 0,
				}}
			>
				{thumbnailSrc ? (
					<img
						src={thumbnailSrc}
						alt={video.title}
						className="w-full h-full object-cover"
						style={{
							transform: hovered ? 'scale(1.05)' : 'scale(1)',
							transition: 'transform 0.45s ease',
						}}
					/>
				) : (
					<div
						className="w-full h-full flex items-center justify-center"
						style={{
							background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
						}}
					>
						<svg width="40" height="40" viewBox="0 0 40 40" fill="none">
							<circle cx="20" cy="20" r="18" fill="white" fillOpacity="0.5" />
							<path d="M16 13L28 20L16 27V13Z" fill="#3b82f6" />
						</svg>
					</div>
				)}

				{/* Play overlay */}
				<div
					className="absolute inset-0 flex items-center justify-center"
					style={{
						background: hovered ? 'rgba(30, 64, 175, 0.42)' : 'rgba(30, 64, 175, 0.08)',
						transition: 'background 0.25s',
					}}
				>
					<div
						style={{
							width: 48,
							height: 48,
							background: hovered ? '#ffffff' : 'rgba(255,255,255,0.75)',
							borderRadius: '50%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 4px 16px rgba(30,80,200,0.25)',
							transform: hovered ? 'scale(1.1)' : 'scale(0.9)',
							transition: 'transform 0.25s, background 0.25s',
						}}
					>
						<svg
							width="16"
							height="18"
							viewBox="0 0 16 18"
							fill="none"
							style={{ marginLeft: 2 }}
						>
							<path d="M2 1L14 9L2 17V1Z" fill="#1d4ed8" />
						</svg>
					</div>
				</div>

				{/* Длительность */}
				{video.duration && (
					<div
						className="absolute bottom-2.5 right-2.5 px-2 py-0.5 text-xs font-semibold"
						style={{
							background: 'rgba(10,20,60,0.72)',
							color: '#e0eaff',
							borderRadius: '6px',
							backdropFilter: 'blur(4px)',
							letterSpacing: '0.03em',
						}}
					>
						{video.duration}
					</div>
				)}

				{/* External badge */}
				{video.isExternal && (
					<div
						className="absolute top-2.5 left-2.5 px-2 py-0.5 text-xs font-semibold flex items-center gap-1"
						style={{
							background: 'rgba(255,255,255,0.88)',
							color: '#1d4ed8',
							borderRadius: '6px',
							border: '1.5px solid #bfdbfe',
							backdropFilter: 'blur(4px)',
						}}
					>
						<span style={{ fontSize: 10 }}>↗</span> YouTube
					</div>
				)}
			</div>

			{/* Текст */}
			<div className="p-4 flex flex-col gap-2 flex-1">
				<h4
					className="font-bold text-sm leading-snug"
					style={{
						color: hovered ? '#1d4ed8' : '#1e3a8a',
						fontFamily: 'Georgia, serif',
						transition: 'color 0.15s',
					}}
				>
					{video.title}
				</h4>
				<p
					className="text-xs leading-relaxed line-clamp-2 flex-1"
					style={{ color: '#6b8fc4' }}
				>
					{video.description}
				</p>
				<div className="flex flex-wrap gap-1.5 mt-1">
					{video.tags.map((tag) => (
						<span
							key={tag}
							className="px-2 py-0.5 text-xs font-semibold"
							style={{
								color: '#2563eb',
								border: '1.5px solid #bfdbfe',
								background: '#eff6ff',
								borderRadius: '999px',
							}}
						>
							{tag}
						</span>
					))}
				</div>
			</div>
		</motion.div>
	);
}

// ─── Фильтр-бар ─────────────────────────
function FilterBar({
	tags,
	active,
	onSelect,
	count,
}: {
	tags: string[];
	active: string;
	onSelect: (tag: string) => void;
	count: number;
}) {
	return (
		<div
			className="mb-6 p-1.5 flex items-center gap-1.5 flex-wrap"
			style={{
				background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
				borderRadius: '16px',
				border: '2px solid #bfdbfe',
			}}
		>
			{tags.map((tag) => {
				const isActive = active === tag;
				return (
					<button
						key={tag}
						onClick={() => onSelect(tag)}
						className="relative px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95"
						style={{
							borderRadius: '12px',
							border: 'none',
							background: isActive ? '#1d4ed8' : 'transparent',
							color: isActive ? '#ffffff' : '#3b6fd4',
							boxShadow: isActive ? '0 4px 14px rgba(29, 78, 216, 0.35)' : 'none',
							transform: isActive ? 'translateY(-1px)' : 'none',
						}}
					>
						{tag}
						{isActive && (
							<motion.span
								layoutId="filter-pill"
								className="absolute inset-0"
								style={{
									background: '#1d4ed8',
									borderRadius: '12px',
									zIndex: -1,
								}}
								transition={{
									type: 'spring',
									bounce: 0.2,
									duration: 0.4,
								}}
							/>
						)}
					</button>
				);
			})}
			<span className="ml-auto pr-2 text-xs font-semibold" style={{ color: '#6b8fc4' }}>
				{count} видео
			</span>
		</div>
	);
}

// ─── Главный компонент ──────────────────
export default function VideoGallery() {
	const allTags = getAllTags(VIDEOS);
	const [activeTag, setActiveTag] = useState('Все');
	const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

	const filtered =
		activeTag === 'Все' ? VIDEOS : VIDEOS.filter((v) => v.tags.includes(activeTag));

	return (
		<MainLayout title="Видеогалерея">
			<FilterBar
				tags={allTags}
				active={activeTag}
				onSelect={setActiveTag}
				count={filtered.length}
			/>

			<div className="overflow-y-auto flex-1 pr-1">
				<AnimatePresence mode="wait">
					<motion.div
						key={activeTag}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={{ duration: 0.18 }}
						className="grid grid-cols-3 gap-4"
					>
						{filtered.map((video, i) => (
							<VideoCard
								key={video.id}
								video={video}
								index={i}
								onClick={() => setSelectedVideo(video)}
							/>
						))}
					</motion.div>
				</AnimatePresence>
			</div>

			<AnimatePresence>
				{selectedVideo && (
					<VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
				)}
			</AnimatePresence>
		</MainLayout>
	);
}

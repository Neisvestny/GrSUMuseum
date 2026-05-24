import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MediaItem } from '../../types/document';

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

export default function MediaStrip({ items }: { items: MediaItem[] }) {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	if (!items.length) return null;

	return (
		<>
			<div className="flex gap-3 overflow-x-auto pb-1">
				{items.map((m, idx) => (
					<button
						key={`${m.kind}:${m.src}:${idx}`}
						type="button"
						onClick={() => setOpenIndex(idx)}
						className="shrink-0 rounded-2xl border-2 border-blue-100 bg-white hover:bg-blue-50 transition-all px-4 py-3 text-left min-w-64"
					>
						<div className="text-xs text-gray-400 mb-0.5">
							{m.kind === 'photo' ? 'Фото' : 'Видео'}
						</div>
						<div className="text-sm font-semibold text-blue-800 truncate">
							{m.title ?? m.src}
						</div>
					</button>
				))}
			</div>

			<AnimatePresence>
				{openIndex !== null && (
					<MediaLightbox
						items={items}
						index={openIndex}
						onChangeIndex={setOpenIndex}
						onClose={() => setOpenIndex(null)}
					/>
				)}
			</AnimatePresence>
		</>
	);
}

function MediaLightbox({
	items,
	index,
	onChangeIndex,
	onClose,
}: {
	items: MediaItem[];
	index: number;
	onChangeIndex: (next: number) => void;
	onClose: () => void;
}) {
	const item = items[index];
	const embedUrl = useMemo(
		() => (item.kind === 'video' && item.is_external ? getEmbedUrl(item.src) : null),
		[item],
	);

	const touchStartX = useRef(0);
	const touchEndX = useRef(0);
	const MIN = 60;

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
			if (e.key === 'ArrowLeft') onChangeIndex((index - 1 + items.length) % items.length);
			if (e.key === 'ArrowRight') onChangeIndex((index + 1) % items.length);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [index, items.length, onChangeIndex, onClose]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-50 flex items-center justify-center"
			style={{ backgroundColor: 'rgba(1, 15, 50, 0.85)' }}
			onClick={onClose}
		>
			<motion.div
				initial={{ scale: 0.97, opacity: 0, y: 12 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.98, opacity: 0, y: 8 }}
				transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
				className="relative z-10 w-full max-w-4xl mx-6 bg-white rounded-3xl border-2 border-blue-100 shadow-2xl overflow-hidden"
				onClick={(e) => e.stopPropagation()}
				onTouchStart={(e) => {
					touchStartX.current = e.changedTouches[0].screenX;
				}}
				onTouchEnd={(e) => {
					touchEndX.current = e.changedTouches[0].screenX;
					const dist = touchEndX.current - touchStartX.current;
					if (Math.abs(dist) < MIN) return;
					if (dist > 0) onChangeIndex((index - 1 + items.length) % items.length);
					else onChangeIndex((index + 1) % items.length);
				}}
			>
				<div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
					{item.kind === 'photo' ? (
						<img src={item.src} alt={item.title ?? ''} className="w-full h-full object-contain" />
					) : embedUrl ? (
						<iframe
							src={embedUrl}
							className="w-full h-full"
							allow="autoplay; fullscreen; picture-in-picture"
							allowFullScreen
							style={{ border: 'none', display: 'block' }}
						/>
					) : (
						<video src={item.src} className="w-full h-full" controls autoPlay />
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
				<div className="p-5 border-t-2 border-blue-50 bg-gradient-to-br from-blue-50 to-white">
					<div className="text-blue-900 font-bold">{item.title ?? ''}</div>
					{item.description && <div className="text-sm text-blue-700 mt-1">{item.description}</div>}
					<div className="flex items-center justify-between mt-3">
						<button
							type="button"
							onClick={() => onChangeIndex((index - 1 + items.length) % items.length)}
							className="text-sm font-semibold text-blue-700 hover:text-blue-900"
						>
							←
						</button>
						<div className="text-xs text-gray-400">
							{index + 1} / {items.length}
						</div>
						<button
							type="button"
							onClick={() => onChangeIndex((index + 1) % items.length)}
							className="text-sm font-semibold text-blue-700 hover:text-blue-900"
						>
							→
						</button>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}


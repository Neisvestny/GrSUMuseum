import { useEffect, useMemo, useState } from 'react';
import {
	fetchGalleryPhotos,
	fetchGalleryVideos,
	type GalleryPhoto,
	type GalleryVideo,
} from '../../../../api/gallery';
import type { MediaItem } from '../../../../types/media';
import AdminButton from '../ui/AdminButton';
import MediaPreviewThumb from '../ui/MediaPreviewThumb';

type MediaChoice = MediaItem & { key: string };

function toChoicePhoto(p: GalleryPhoto): MediaChoice {
	return {
		key: `photo:${p.id}`,
		kind: 'photo',
		src: p.src,
		title: p.title,
		description: p.annotation,
	};
}

function toChoiceVideo(v: GalleryVideo): MediaChoice {
	return {
		key: `video:${v.id}`,
		kind: 'video',
		src: v.src,
		title: v.title,
		description: v.description,
		is_external: Boolean(v.is_external),
	};
}

export default function MediaBrowserModal({
	open,
	title = 'Выбор медиа',
	initialSelected,
	onClose,
	onConfirm,
}: {
	open: boolean;
	title?: string;
	initialSelected: MediaItem[];
	onClose: () => void;
	onConfirm: (items: MediaItem[]) => void;
}) {
	const [loading, setLoading] = useState(false);
	const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
	const [videos, setVideos] = useState<GalleryVideo[]>([]);
	const [selected, setSelected] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (!open) return;
		const s = new Set<string>();
		for (const it of initialSelected) {
			s.add(`${it.kind}:${it.src}`);
		}
		setSelected(s);
	}, [open, initialSelected]);

	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		setLoading(true);
		Promise.all([fetchGalleryPhotos(), fetchGalleryVideos()])
			.then(([p, v]) => {
				if (cancelled) return;
				setPhotos(p);
				setVideos(v);
			})
			.finally(() => {
				if (cancelled) return;
				setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [open]);

	const choices = useMemo(() => {
		const list: MediaChoice[] = [];
		for (const p of photos) list.push(toChoicePhoto(p));
		for (const v of videos) list.push(toChoiceVideo(v));
		return list;
	}, [photos, videos]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50">
			<div className="absolute inset-0 bg-black/40" onMouseDown={onClose} role="presentation" />
			<div className="absolute inset-0 p-4 md:p-8 flex items-start justify-center overflow-auto">
				<div
					className="w-full max-w-5xl bg-white rounded-3xl border-2 border-blue-100 shadow-2xl overflow-hidden"
					onMouseDown={(e) => e.stopPropagation()}
					role="presentation"
				>
					<div className="flex items-center justify-between px-6 py-4 border-b border-blue-50 bg-blue-50/40">
						<div className="text-blue-900 font-bold">{title}</div>
						<div className="flex gap-2">
							<AdminButton size="sm" variant="secondary" onClick={onClose}>
								Отмена
							</AdminButton>
							<AdminButton
								size="sm"
								variant="primary"
								onClick={() => {
									const picked: MediaItem[] = [];
									for (const c of choices) {
										if (selected.has(`${c.kind}:${c.src}`)) {
											const { key, ...item } = c;
											void key;
											picked.push(item);
										}
									}
									onConfirm(picked);
									onClose();
								}}
							>
								Выбрать
							</AdminButton>
						</div>
					</div>
					<div className="p-4">
						{loading ? (
							<div className="text-blue-600">Загрузка…</div>
						) : (
							<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
								{choices.map((c) => {
									const k = `${c.kind}:${c.src}`;
									const isSel = selected.has(k);
									return (
										<button
											key={c.key}
											type="button"
											onClick={() =>
												setSelected((prev) => {
													const next = new Set(prev);
													if (next.has(k)) next.delete(k);
													else next.add(k);
													return next;
												})
											}
											className={`rounded-2xl border-2 p-3 text-left transition-all ${
												isSel
													? 'border-blue-700 bg-blue-50 ring-2 ring-blue-200'
													: 'border-blue-100 hover:border-blue-300'
											}`}
										>
											<MediaPreviewThumb
												url={c.src}
												root={c.kind === 'photo' ? 'images' : 'videos'}
												fileName={c.title ?? c.src}
												size="lg"
												className="mb-2"
											/>
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0 flex-1">
													<div className="text-xs text-gray-400 mb-0.5">
														{c.kind === 'photo' ? 'Фото' : 'Видео'}
													</div>
													<div className="text-sm font-semibold text-blue-800 truncate">
														{c.title ?? c.src}
													</div>
												</div>
												<span
													className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs ${
														isSel
															? 'border-blue-700 bg-blue-700 text-white'
															: 'border-blue-200 bg-white'
													}`}
													aria-hidden
												>
													{isSel ? '✓' : ''}
												</span>
											</div>
										</button>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

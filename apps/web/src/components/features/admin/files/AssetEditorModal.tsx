import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
	fetchRemoteVideoMeta,
	publicUrlFor,
	updateMediaAsset,
	type MediaBrowseAsset,
	type MediaBrowseEntry,
	type MediaRoot,
} from '../../../../api/media';
import { ApiError } from '../../../../shared/api/client';
import { getPreviewKind, getVideoThumbnail, getYoutubeId } from '../../../../lib/media-preview';
import { resolvePublicAssetUrl } from '../../../../lib/public-asset-url';
import AdminButton from '../ui/AdminButton';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';

function errorMessage(error: unknown, fallback: string): string {
	return error instanceof ApiError ? error.message : fallback;
}

type Props = {
	open: boolean;
	root: MediaRoot;
	entry: MediaBrowseEntry;
	asset: MediaBrowseAsset;
	onClose: () => void;
	onSaved: () => void;
};

export default function AssetEditorModal({
	open,
	root,
	entry,
	asset,
	onClose,
	onSaved,
}: Props) {
	const url = entry.url ?? publicUrlFor(root, entry.relPath);
	const isExternal = asset.is_external;

	const [title, setTitle] = useState(asset.title ?? entry.name);
	const [alt, setAlt] = useState(asset.alt ?? '');
	const [src, setSrc] = useState(url);
	const [showPhoto, setShowPhoto] = useState(asset.showInPhotoGallery);
	const [showVideo, setShowVideo] = useState(asset.showInVideoGallery);
	const [year, setYear] = useState(String(asset.year ?? new Date().getFullYear()));
	const [annotation, setAnnotation] = useState(asset.annotation);
	const [description, setDescription] = useState(asset.description);
	const [tags, setTags] = useState(asset.tags.join(', '));
	const [duration, setDuration] = useState(asset.duration ?? '');
	const [busy, setBusy] = useState(false);
	const [metaLoading, setMetaLoading] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const metaRequestRef = useRef(0);

	const previewUrl = isExternal ? src : url;
	const previewKind = useMemo(
		() =>
			getPreviewKind({
				root,
				url: previewUrl,
				mimeType: asset.mimeType,
				fileName: entry.name,
			}),
		[root, previewUrl, asset.mimeType, entry.name],
	);

	const isImage = previewKind === 'image';
	const isVideo = previewKind === 'video';
	const showPhotoFields = isImage || showPhoto;
	const showVideoFields = isVideo || showVideo;
	const videoThumb = isVideo ? getVideoThumbnail(previewUrl) : null;

	useEffect(() => {
		if (!open) return;
		setTitle(asset.title ?? entry.name);
		setAlt(asset.alt ?? '');
		setSrc(url);
		setShowPhoto(asset.showInPhotoGallery);
		setShowVideo(asset.showInVideoGallery);
		setYear(String(asset.year ?? new Date().getFullYear()));
		setAnnotation(asset.annotation);
		setDescription(asset.description);
		setTags(asset.tags.join(', '));
		setDuration(asset.duration ?? '');
		setErr(null);
	}, [open, asset, entry, url]);

	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open, onClose]);

	useEffect(() => {
		if (!open) return;
		const youtubeId = getYoutubeId(src);
		if (!youtubeId) return;

		const requestId = ++metaRequestRef.current;
		const timer = window.setTimeout(() => {
			void (async () => {
				setMetaLoading(true);
				try {
					const meta = await fetchRemoteVideoMeta(src);
					if (requestId !== metaRequestRef.current) return;
					if (meta.title) setTitle(meta.title);
					if (meta.duration) setDuration(meta.duration);
				} catch {
					// manual input remains available
				} finally {
					if (requestId === metaRequestRef.current) setMetaLoading(false);
				}
			})();
		}, 500);

		return () => {
			window.clearTimeout(timer);
		};
	}, [open, src]);

	const save = async () => {
		if (showPhoto && (!year.trim() || Number(year) <= 0)) {
			setErr('Укажите год — в фотогалерее снимки группируются по годам');
			return;
		}

		setBusy(true);
		setErr(null);
		try {
			await updateMediaAsset(asset.id, {
				title: title.trim(),
				alt: showPhotoFields || isImage ? alt.trim() || undefined : undefined,
				src: isExternal ? src.trim() : undefined,
				showInPhotoGallery: showPhoto,
				showInVideoGallery: showVideo,
				year: showPhotoFields ? Number(year) || 0 : undefined,
				annotation: showPhotoFields ? annotation : undefined,
				description: showVideoFields ? description : undefined,
				tags: showVideoFields
					? tags
							.split(',')
							.map((t) => t.trim())
							.filter(Boolean)
					: undefined,
				duration: showVideoFields ? duration || null : undefined,
				is_external: asset.is_external,
			});
			onSaved();
		} catch (e) {
			setErr(errorMessage(e, 'Не удалось сохранить'));
		} finally {
			setBusy(false);
		}
	};

	if (typeof document === 'undefined') return null;

	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					key="asset-editor-modal"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.18 }}
					className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
					onClick={onClose}
				>
					<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
					<motion.div
						initial={{ scale: 0.96, opacity: 0, y: 16 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.98, opacity: 0, y: 8 }}
						transition={{ type: 'spring', stiffness: 420, damping: 28 }}
						className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-blue-100 bg-white shadow-2xl"
						onClick={(e) => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-labelledby="asset-editor-title"
					>
						<div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-blue-50 bg-white/95 px-6 py-4 backdrop-blur-sm">
							<div className="min-w-0">
								<h2 id="asset-editor-title" className="text-lg font-bold text-blue-900">
									Свойства файла
								</h2>
								<p className="mt-1 truncate text-xs text-gray-400">{isExternal ? src : url}</p>
							</div>
							<AdminButton size="sm" variant="secondary" onClick={onClose}>
								Закрыть
							</AdminButton>
						</div>

						<div className="p-6">
							{metaLoading && (
								<p className="mb-4 text-sm font-medium text-blue-600">
									Подтягиваем данные с YouTube…
								</p>
							)}
							{err && <p className="mb-4 text-sm text-red-600">{err}</p>}

							<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
								<div className="flex flex-col gap-4">
									{isImage && (
										<img
											src={resolvePublicAssetUrl(previewUrl)}
											alt={alt || title}
											className="w-full max-h-56 rounded-xl border border-blue-100 bg-blue-50 object-contain"
										/>
									)}
									{isVideo && videoThumb && (
										<img
											src={videoThumb}
											alt={title}
											className="aspect-video w-full rounded-xl border border-blue-100 bg-blue-50 object-cover"
										/>
									)}

									<section className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
										<h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-800">
											Основное
										</h3>
										<div className="flex flex-col gap-3">
											<label>
												<span className={adminLabelClass}>Название</span>
												<input
													className={adminInputClass}
													value={title}
													onChange={(e) => setTitle(e.target.value)}
												/>
											</label>
											{(isImage || showPhotoFields) && (
												<label>
													<span className={adminLabelClass}>Alt-текст (доступность)</span>
													<input
														className={adminInputClass}
														value={alt}
														onChange={(e) => setAlt(e.target.value)}
														placeholder="Краткое описание изображения для screen reader"
													/>
												</label>
											)}
											{isExternal && (
												<label>
													<span className={adminLabelClass}>Ссылка (URL)</span>
													<input
														className={adminInputClass}
														value={src}
														onChange={(e) => setSrc(e.target.value)}
													/>
												</label>
											)}
										</div>
									</section>
								</div>

								<div className="flex flex-col gap-4">
									{(isImage || isVideo) && (
										<section className="rounded-xl border border-blue-100 bg-white p-4">
											<h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-800">
												Публикация в галереях
											</h3>
											<div className="flex flex-col gap-3">
												{(isImage || root === 'images') && (
													<label className="flex cursor-pointer items-center gap-2">
														<input
															type="checkbox"
															checked={showPhoto}
															onChange={(e) => setShowPhoto(e.target.checked)}
															className="h-4 w-4"
														/>
														<span className="text-sm font-semibold text-blue-800">
															Показывать в фотогалерее
														</span>
													</label>
												)}
												{(isVideo || root === 'videos') && (
													<label className="flex cursor-pointer items-center gap-2">
														<input
															type="checkbox"
															checked={showVideo}
															onChange={(e) => setShowVideo(e.target.checked)}
															className="h-4 w-4"
														/>
														<span className="text-sm font-semibold text-blue-800">
															Показывать в видеогалерее
														</span>
													</label>
												)}
											</div>
										</section>
									)}

									{showPhotoFields && (
										<section className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
											<h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-amber-900">
												Фотогалерея
											</h3>
											<p className="mb-3 text-xs text-amber-800/80">
												Снимки группируются и фильтруются по году. Подпись отображается в
												lightbox.
											</p>
											<div className="flex flex-col gap-3">
												<label>
													<span className={adminLabelClass}>
														Год <span className="text-red-500">*</span>
													</span>
													<input
														className={adminInputClass}
														type="number"
														min={1}
														value={year}
														onChange={(e) => setYear(e.target.value)}
														required
													/>
												</label>
												<label>
													<span className={adminLabelClass}>Подпись к снимку</span>
													<textarea
														className={`${adminInputClass} h-24 resize-none`}
														value={annotation}
														onChange={(e) => setAnnotation(e.target.value)}
														placeholder="Краткая подпись, отображается под фото в галерее"
													/>
												</label>
											</div>
										</section>
									)}

									{showVideoFields && (
										<section className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
											<h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-violet-900">
												Видеогалерея
											</h3>
											<div className="flex flex-col gap-3">
												<label>
													<span className={adminLabelClass}>Описание</span>
													<textarea
														className={`${adminInputClass} h-24 resize-none`}
														value={description}
														onChange={(e) => setDescription(e.target.value)}
													/>
												</label>
												<label>
													<span className={adminLabelClass}>Теги (через запятую)</span>
													<input
														className={adminInputClass}
														value={tags}
														onChange={(e) => setTags(e.target.value)}
													/>
												</label>
												<label>
													<span className={adminLabelClass}>Длительность</span>
													<input
														className={adminInputClass}
														value={duration}
														onChange={(e) => setDuration(e.target.value)}
														placeholder="12:34"
													/>
												</label>
											</div>
										</section>
									)}

									{!isImage && !isVideo && (
										<p className="text-sm text-gray-500">
											Документ доступен по ссылке. Галереи — только для фото и видео.
										</p>
									)}
								</div>
							</div>
						</div>

						<div className="sticky bottom-0 flex gap-2 border-t border-blue-50 bg-white/95 px-6 py-4 backdrop-blur-sm">
							<AdminButton variant="primary" disabled={busy} onClick={() => void save()}>
								{busy ? 'Сохранение…' : 'Сохранить'}
							</AdminButton>
							<AdminButton variant="secondary" disabled={busy} onClick={onClose}>
								Отмена
							</AdminButton>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
}

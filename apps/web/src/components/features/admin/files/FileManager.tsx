import {
	DndContext,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	browseMedia,
	deleteMediaPath,
	mkdirMedia,
	moveMediaPath,
	publicUrlFor,
	renameMediaPath,
	updateMediaAsset,
	uploadMediaByUrl,
	uploadMediaFiles,
	type MediaBrowseAsset,
	type MediaBrowseEntry,
	type MediaRoot,
} from '../../../../api/media';
import { ApiError } from '../../../../shared/api/client';
import AdminButton from '../ui/AdminButton';
import MediaPreviewThumb from '../ui/MediaPreviewThumb';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';

const ROOTS: Array<{ id: MediaRoot; label: string; icon: string }> = [
	{ id: 'images', label: 'Изображения', icon: '🖼️' },
	{ id: 'videos', label: 'Видео', icon: '🎬' },
	{ id: 'files', label: 'Файлы', icon: '📄' },
];

function errorMessage(error: unknown, fallback: string): string {
	return error instanceof ApiError ? error.message : fallback;
}

function relDirOf(relPath: string): string {
	const parts = relPath.split('/').filter(Boolean);
	return parts.slice(0, -1).join('/');
}

function joinRel(dir: string, name: string): string {
	const d = dir.trim().replace(/^\/+|\/+$/g, '');
	const n = name.trim().replace(/^\/+|\/+$/g, '');
	if (!d) return n;
	if (!n) return d;
	return `${d}/${n}`;
}

function isDir(e: MediaBrowseEntry): boolean {
	return e.kind === 'dir';
}

export type FileManagerProps = {
	initialRoot?: MediaRoot;
	initialDir?: string;
	onPick?: (url: string, entry: MediaBrowseEntry, root: MediaRoot) => void;
	allowPickKinds?: Array<'file' | 'dir'>;
};

export default function FileManager({
	initialRoot = 'images',
	initialDir = '',
	onPick,
	allowPickKinds,
}: FileManagerProps) {
	const [root, setRoot] = useState<MediaRoot>(initialRoot);
	const [dir, setDir] = useState(initialDir);
	const [entries, setEntries] = useState<MediaBrowseEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [creatingFolder, setCreatingFolder] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [urlToUpload, setUrlToUpload] = useState('');
	const [uploading, setUploading] = useState(false);
	const [editingAsset, setEditingAsset] = useState<{
		entry: MediaBrowseEntry;
		asset: MediaBrowseAsset;
	} | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

	const reload = async (nextRoot = root, nextDir = dir) => {
		try {
			setLoading(true);
			setError(null);
			const res = await browseMedia(nextRoot, nextDir);
			setRoot(res.root);
			setDir(res.dir);
			setEntries(res.entries);
		} catch (e) {
			setError(errorMessage(e, 'Не удалось загрузить файлы'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void reload(initialRoot, initialDir);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const parentDir = useMemo(() => relDirOf(dir), [dir]);
	const breadcrumbs = useMemo(() => {
		const parts = dir.split('/').filter(Boolean);
		const items: Array<{ label: string; rel: string }> = [{ label: root, rel: '' }];
		let acc = '';
		for (const p of parts) {
			acc = joinRel(acc, p);
			items.push({ label: p, rel: acc });
		}
		return items;
	}, [dir, root]);

	const allowPick = allowPickKinds ? new Set(allowPickKinds) : null;
	const pickMode = Boolean(onPick);

	const switchRoot = (next: MediaRoot) => {
		setEditingAsset(null);
		void reload(next, '');
	};

	const handleUploadFiles = async (files: File[]) => {
		if (!files.length) return;
		setUploading(true);
		setError(null);
		try {
			await uploadMediaFiles(root, dir, files);
			await reload(root, dir);
		} catch (e) {
			setError(errorMessage(e, 'Не удалось загрузить файлы'));
		} finally {
			setUploading(false);
		}
	};

	const handleCreateFolder = async () => {
		const name = newFolderName.trim();
		if (!name) return;
		try {
			await mkdirMedia(root, dir, name);
			setNewFolderName('');
			setCreatingFolder(false);
			await reload(root, dir);
		} catch (e) {
			setError(errorMessage(e, 'Не удалось создать папку'));
		}
	};

	const handleUploadByUrl = async () => {
		const url = urlToUpload.trim();
		if (!url) return;
		setUploading(true);
		setError(null);
		try {
			await uploadMediaByUrl(root, dir, url);
			setUrlToUpload('');
			await reload(root, dir);
		} catch (e) {
			setError(errorMessage(e, 'Не удалось добавить ссылку'));
		} finally {
			setUploading(false);
		}
	};

	const onDragEnd = async (evt: DragEndEvent) => {
		const from = String(evt.active.id);
		const over = evt.over?.id ? String(evt.over.id) : '';
		if (!over.startsWith('dir:')) return;
		const toDir = over.slice('dir:'.length);
		if (toDir === relDirOf(from)) return;
		try {
			await moveMediaPath(root, from, toDir);
			await reload(root, dir);
		} catch (e) {
			setError(errorMessage(e, 'Не удалось переместить'));
		}
	};

	return (
		<DndContext sensors={sensors} onDragEnd={(e) => void onDragEnd(e)}>
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap gap-2">
					{ROOTS.map((r) => (
						<button
							key={r.id}
							type="button"
							onClick={() => switchRoot(r.id)}
							className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
								root === r.id
									? 'bg-blue-700 text-white border-blue-700'
									: 'border-blue-200 text-blue-800 hover:bg-blue-50'
							}`}
						>
							{r.icon} {r.label}
						</button>
					))}
				</div>

				<div className="grid grid-cols-[280px_1fr] gap-4">
					<aside className="bg-white border-2 border-blue-100 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="text-blue-800 font-bold">Папки</div>
							<AdminButton size="sm" onClick={() => void reload(root, dir)}>
								⟳
							</AdminButton>
						</div>
						<FolderTree root={root} currentDir={dir} onNavigate={(d) => void reload(root, d)} />
					</aside>

					<section className="bg-white border-2 border-blue-100 rounded-2xl p-4 min-h-[480px]">
						<div className="flex flex-wrap items-center gap-2 mb-3">
							{breadcrumbs.map((b, i) => (
								<button
									key={`${b.rel}-${i}`}
									type="button"
									onClick={() => void reload(root, b.rel)}
									className={`text-sm font-semibold ${
										i === breadcrumbs.length - 1
											? 'text-blue-900'
											: 'text-blue-600 hover:text-blue-800'
									}`}
								>
									/{b.label}
								</button>
							))}
						</div>

						{!pickMode && (
							<div className="flex flex-wrap gap-2 mb-4">
								<AdminButton size="sm" variant="secondary" onClick={() => setCreatingFolder((v) => !v)}>
									+ Папка
								</AdminButton>
								<AdminButton
									size="sm"
									variant="primary"
									disabled={uploading}
									onClick={() => fileInputRef.current?.click()}
								>
									{uploading ? 'Загрузка…' : '+ Файл'}
								</AdminButton>
								<input
									ref={fileInputRef}
									type="file"
									multiple
									className="hidden"
									onChange={(e) => void handleUploadFiles(Array.from(e.target.files ?? []))}
								/>
							</div>
						)}

						{!pickMode && creatingFolder && (
							<form
								className="flex flex-wrap gap-2 mb-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100"
								onSubmit={(e) => {
									e.preventDefault();
									void handleCreateFolder();
								}}
							>
								<input
									className={adminInputClass}
									value={newFolderName}
									onChange={(e) => setNewFolderName(e.target.value)}
									placeholder="имя подпапки"
								/>
								<AdminButton size="sm" type="submit" variant="primary">
									Создать
								</AdminButton>
							</form>
						)}

						{!pickMode && (
							<div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
								<input
									className={`${adminInputClass} flex-1 min-w-48`}
									value={urlToUpload}
									onChange={(e) => setUrlToUpload(e.target.value)}
									placeholder="Ссылка: https://… или путь к файлу"
								/>
								<AdminButton
									size="sm"
									variant="secondary"
									disabled={uploading}
									onClick={() => void handleUploadByUrl()}
								>
									Добавить ссылку
								</AdminButton>
							</div>
						)}

						{error && (
							<div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-2 mb-3">
								{error}
							</div>
						)}

						<div
							className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/20 p-4"
							onDrop={
								pickMode
									? undefined
									: (e) => {
											e.preventDefault();
											void handleUploadFiles(Array.from(e.dataTransfer.files ?? []));
										}
							}
							onDragOver={pickMode ? undefined : (e) => e.preventDefault()}
						>
							{loading ? (
								<div className="text-blue-600">Загрузка…</div>
							) : entries.length === 0 ? (
								<div className="text-gray-400 text-sm">Папка пустая</div>
							) : pickMode ? (
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
									{dir && (
										<button
											type="button"
											onClick={() => void reload(root, parentDir)}
											className="rounded-2xl border-2 border-blue-100 bg-white hover:border-blue-300 p-3 text-left transition-all"
										>
											<div className="w-full aspect-video rounded-xl bg-blue-50 flex items-center justify-center text-3xl mb-2">
												↩
											</div>
											<div className="text-sm font-semibold text-blue-800 truncate">..</div>
										</button>
									)}
									{entries.map((e) => {
										const fileUrl = e.url ?? publicUrlFor(root, e.relPath);
										if (isDir(e)) {
											return (
												<button
													key={e.relPath}
													type="button"
													onClick={() => void reload(root, e.relPath)}
													className="rounded-2xl border-2 border-blue-100 bg-white hover:border-blue-300 p-3 text-left transition-all"
												>
													<div className="w-full aspect-video rounded-xl bg-amber-50 flex items-center justify-center text-4xl mb-2">
														📁
													</div>
													<div className="text-sm font-semibold text-blue-800 truncate">
														{e.name}
													</div>
												</button>
											);
										}
										if (!onPick || (allowPick && !allowPick.has(e.kind))) return null;
										return (
											<button
												key={e.relPath}
												type="button"
												onClick={() => onPick(fileUrl, e, root)}
												className="rounded-2xl border-2 border-blue-100 bg-white hover:border-blue-500 hover:shadow-md p-3 text-left transition-all group"
											>
												<MediaPreviewThumb
													url={fileUrl}
													root={root}
													mimeType={e.asset?.mimeType}
													fileName={e.name}
													size="lg"
													className="mb-2"
												/>
												<div className="text-sm font-semibold text-blue-800 truncate">
													{e.name}
												</div>
												<div className="text-xs text-blue-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
													Выбрать
												</div>
											</button>
										);
									})}
								</div>
							) : (
								<div className="flex flex-col gap-2">
									{dir && (
										<button
											type="button"
											onClick={() => void reload(root, parentDir)}
											className="text-left text-sm text-blue-700 font-semibold px-2 py-1"
										>
											↩ ..
										</button>
									)}
									{entries.map((e) => (
										<EntryRow
											key={e.relPath}
											root={root}
											entry={e}
											onNavigate={(d) => void reload(root, d)}
											onDelete={() => void deleteMediaPath(root, e.relPath).then(() => reload(root, dir))}
											onRename={async (newName) => {
												await renameMediaPath(root, e.relPath, newName);
												await reload(root, relDirOf(e.relPath));
											}}
											onEditAsset={(asset) => setEditingAsset({ entry: e, asset })}
										/>
									))}
								</div>
							)}
						</div>
					</section>
				</div>

				{editingAsset && (
					<AssetEditor
						root={root}
						entry={editingAsset.entry}
						asset={editingAsset.asset}
						onClose={() => setEditingAsset(null)}
						onSaved={() => void reload(root, dir).then(() => setEditingAsset(null))}
					/>
				)}
			</div>
		</DndContext>
	);
}

function AssetEditor({
	root,
	entry,
	asset,
	onClose,
	onSaved,
}: {
	root: MediaRoot;
	entry: MediaBrowseEntry;
	asset: MediaBrowseAsset;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [title, setTitle] = useState(asset.title ?? entry.name);
	const [showPhoto, setShowPhoto] = useState(asset.showInPhotoGallery);
	const [showVideo, setShowVideo] = useState(asset.showInVideoGallery);
	const [year, setYear] = useState(String(asset.year ?? new Date().getFullYear()));
	const [annotation, setAnnotation] = useState(asset.annotation);
	const [description, setDescription] = useState(asset.description);
	const [tags, setTags] = useState(asset.tags.join(', '));
	const [duration, setDuration] = useState(asset.duration ?? '');
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const url = entry.url ?? publicUrlFor(root, entry.relPath);
	const isImage = asset.mimeType.startsWith('image/');
	const isVideo = asset.mimeType.startsWith('video/');

	const save = async () => {
		setBusy(true);
		setErr(null);
		try {
			await updateMediaAsset(asset.id, {
				title: title.trim(),
				showInPhotoGallery: showPhoto,
				showInVideoGallery: showVideo,
				year: isImage ? Number(year) || 0 : undefined,
				annotation: isImage ? annotation : undefined,
				description: isVideo ? description : undefined,
				tags: isVideo
					? tags
							.split(',')
							.map((t) => t.trim())
							.filter(Boolean)
					: undefined,
				duration: isVideo ? duration || null : undefined,
				is_external: asset.is_external,
			});
			onSaved();
		} catch (e) {
			setErr(errorMessage(e, 'Не удалось сохранить'));
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-lg">
			<div className="flex items-start justify-between gap-4 mb-4">
				<div>
					<h3 className="text-blue-900 font-bold">Свойства файла</h3>
					<p className="text-xs text-gray-400 mt-1 break-all">{url}</p>
				</div>
				<AdminButton size="sm" variant="secondary" onClick={onClose}>
					Закрыть
				</AdminButton>
			</div>

			{err && <p className="text-sm text-red-600 mb-3">{err}</p>}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="flex flex-col gap-3">
					{isImage && (
						<img
							src={url}
							alt={title}
							className="w-full max-h-48 object-contain rounded-xl border border-blue-100 bg-blue-50"
						/>
					)}
					<label>
						<span className={adminLabelClass}>Название</span>
						<input className={adminInputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={showPhoto}
							onChange={(e) => setShowPhoto(e.target.checked)}
							className="w-4 h-4"
						/>
						<span className="text-sm font-semibold text-blue-800">Показывать в фотогалерее</span>
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={showVideo}
							onChange={(e) => setShowVideo(e.target.checked)}
							className="w-4 h-4"
						/>
						<span className="text-sm font-semibold text-blue-800">Показывать в видеогалерее</span>
					</label>
				</div>

				<div className="flex flex-col gap-3">
					{isImage && (
						<>
							<label>
								<span className={adminLabelClass}>Год (фотогалерея)</span>
								<input
									className={adminInputClass}
									type="number"
									value={year}
									onChange={(e) => setYear(e.target.value)}
								/>
							</label>
							<label>
								<span className={adminLabelClass}>Подпись</span>
								<textarea
									className={`${adminInputClass} h-20 resize-none`}
									value={annotation}
									onChange={(e) => setAnnotation(e.target.value)}
								/>
							</label>
						</>
					)}
					{isVideo && (
						<>
							<label>
								<span className={adminLabelClass}>Описание</span>
								<textarea
									className={`${adminInputClass} h-20 resize-none`}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
							</label>
							<label>
								<span className={adminLabelClass}>Теги (через запятую)</span>
								<input className={adminInputClass} value={tags} onChange={(e) => setTags(e.target.value)} />
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
						</>
					)}
					{!isImage && !isVideo && (
						<p className="text-sm text-gray-500">
							Документ доступен по ссылке. Галереи — только для фото и видео.
						</p>
					)}
				</div>
			</div>

			<div className="flex gap-2 mt-4">
				<AdminButton variant="primary" disabled={busy} onClick={() => void save()}>
					{busy ? 'Сохранение…' : 'Сохранить'}
				</AdminButton>
			</div>
		</div>
	);
}

function EntryRow({
	root,
	entry,
	onNavigate,
	onDelete,
	onRename,
	onEditAsset,
}: {
	root: MediaRoot;
	entry: MediaBrowseEntry;
	onNavigate: (dir: string) => void;
	onDelete: () => void;
	onRename: (newName: string) => Promise<void>;
	onEditAsset: (asset: MediaBrowseAsset) => void;
}) {
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState(entry.name);
	const [busy, setBusy] = useState(false);

	const isFolder = entry.kind === 'dir';
	const url = entry.url ?? publicUrlFor(root, entry.relPath);

	const drag = useDraggable({ id: entry.relPath, disabled: isFolder });
	const drop = useDroppable({ id: `dir:${entry.relPath}`, disabled: !isFolder });

	return (
		<div
			ref={drag.setNodeRef}
			{...(!isFolder ? drag.listeners : {})}
			{...(!isFolder ? drag.attributes : {})}
			className={`flex items-center gap-3 px-3 py-2 rounded-xl border border-blue-100 bg-white ${
				drag.isDragging ? 'opacity-60' : ''
			}`}
		>
			<span className="w-12 h-12 flex items-center justify-center shrink-0">
				{isFolder ? (
					<span className="text-2xl">📁</span>
				) : (
					<MediaPreviewThumb
						url={url}
						root={root}
						mimeType={entry.asset?.mimeType}
						fileName={entry.name}
						size="sm"
					/>
				)}
			</span>
			<div className="flex-1 min-w-0">
				{renaming ? (
					<div className="flex gap-2">
						<input
							className={adminInputClass}
							value={name}
							onChange={(e) => setName(e.target.value)}
							autoFocus
						/>
						<AdminButton
							size="sm"
							disabled={busy}
							onClick={() => {
								const next = name.trim();
								if (!next) return;
								setBusy(true);
								void onRename(next).finally(() => setBusy(false));
							}}
						>
							OK
						</AdminButton>
					</div>
				) : (
					<button
						type="button"
						onClick={() => isFolder && onNavigate(entry.relPath)}
						className="text-sm font-semibold text-blue-800 truncate block text-left w-full"
					>
						{entry.name}
					</button>
				)}
				{!isFolder && (
					<div className="text-xs text-gray-400 truncate flex flex-wrap gap-2 mt-0.5">
						<span>{url}</span>
						{entry.asset?.showInPhotoGallery && (
							<span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded">фото</span>
						)}
						{entry.asset?.showInVideoGallery && (
							<span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded">видео</span>
						)}
					</div>
				)}
			</div>
			<div className="flex gap-1 shrink-0">
				{!isFolder && entry.asset && (
					<AdminButton size="sm" variant="secondary" onClick={() => onEditAsset(entry.asset!)}>
						Свойства
					</AdminButton>
				)}
				{isFolder && <div ref={drop.setNodeRef} className="text-[10px] text-blue-400 px-1">drop</div>}
				<AdminButton size="sm" variant="secondary" onClick={() => setRenaming(true)}>
					…
				</AdminButton>
				<AdminButton size="sm" variant="danger" onClick={onDelete}>
					✕
				</AdminButton>
			</div>
		</div>
	);
}

function FolderTree({
	root,
	currentDir,
	onNavigate,
}: {
	root: MediaRoot;
	currentDir: string;
	onNavigate: (dir: string) => void;
}) {
	return (
		<TreeNode rel="" label={root} mediaRoot={root} currentDir={currentDir} onNavigate={onNavigate} />
	);
}

function TreeNode({
	rel,
	label,
	mediaRoot,
	currentDir,
	onNavigate,
}: {
	rel: string;
	label: string;
	mediaRoot: MediaRoot;
	currentDir: string;
	onNavigate: (dir: string) => void;
}) {
	const [open, setOpen] = useState(true);
	const [loading, setLoading] = useState(false);
	const [childDirs, setChildDirs] = useState<MediaBrowseEntry[]>([]);
	const active = currentDir === rel || (rel !== '' && currentDir.startsWith(`${rel}/`));
	const droppable = useDroppable({ id: `dir:${rel}` });

	useEffect(() => {
		if (!open) return;
		setLoading(true);
		void browseMedia(mediaRoot, rel)
			.then((res) => setChildDirs(res.entries.filter(isDir)))
			.finally(() => setLoading(false));
	}, [open, rel, mediaRoot]);

	return (
		<div>
			<div
				ref={droppable.setNodeRef}
				className={`flex items-center gap-1 px-2 py-1 rounded-lg ${active ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
			>
				<button type="button" onClick={() => setOpen((v) => !v)} className="w-5 text-blue-700 text-xs">
					{open ? '−' : '+'}
				</button>
				<button type="button" onClick={() => onNavigate(rel)} className="text-sm font-semibold text-blue-800">
					{label}
				</button>
			</div>
			{open && (
				<div className="ml-4 mt-1">
					{loading ? (
						<div className="text-xs text-gray-400">…</div>
					) : (
						childDirs.map((d) => (
							<TreeNode
								key={d.relPath}
								rel={d.relPath}
								label={d.name}
								mediaRoot={mediaRoot}
								currentDir={currentDir}
								onNavigate={onNavigate}
							/>
						))
					)}
				</div>
			)}
		</div>
	);
}

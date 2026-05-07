import {
	DndContext,
	PointerSensor,
	useDroppable,
	useDraggable,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	deletePath,
	fetchFilesIndex,
	mkdir,
	movePath,
	renamePath,
	uploadByUrl,
	uploadFiles,
	type FileManagerEntry,
} from '../../../../api/files';
import { ApiError } from '../../../../shared/api/client';
import AdminButton from '../ui/AdminButton';
import { adminInputClass } from '../ui/adminFormStyles';

function errorMessage(error: unknown, fallback: string): string {
	return error instanceof ApiError ? error.message : fallback;
}

function relDirOf(relPath: string): string {
	const parts = relPath.split('/').filter(Boolean);
	return parts.slice(0, -1).join('/');
}

function baseNameOf(relPath: string): string {
	const parts = relPath.split('/').filter(Boolean);
	return parts.at(-1) ?? '';
}

function joinRel(dir: string, name: string): string {
	const d = dir.trim().replace(/^\/+|\/+$/g, '');
	const n = name.trim().replace(/^\/+|\/+$/g, '');
	if (!d) return n;
	if (!n) return d;
	return `${d}/${n}`;
}

function isDir(e: FileManagerEntry): boolean {
	return e.kind === 'dir';
}

export type FileManagerProps = {
	initialDir?: string;
	onPick?: (url: string, entry: FileManagerEntry) => void;
	allowPickKinds?: Array<'file' | 'dir'>;
};

export default function FileManager({ initialDir = '', onPick, allowPickKinds }: FileManagerProps) {
	const [dir, setDir] = useState(initialDir);
	const [entries, setEntries] = useState<FileManagerEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [creatingFolder, setCreatingFolder] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');

	const [urlToUpload, setUrlToUpload] = useState('');
	const [uploading, setUploading] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

	const reload = async (nextDir = dir) => {
		try {
			setLoading(true);
			setError(null);
			const res = await fetchFilesIndex(nextDir);
			setDir(res.dir);
			setEntries(res.entries);
		} catch (e) {
			setError(errorMessage(e, 'Не удалось загрузить файлы'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void reload(initialDir);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const parentDir = useMemo(() => relDirOf(dir), [dir]);
	const breadcrumbs = useMemo(() => {
		const parts = dir.split('/').filter(Boolean);
		const items: Array<{ label: string; rel: string }> = [{ label: 'images', rel: '' }];
		let acc = '';
		for (const p of parts) {
			acc = joinRel(acc, p);
			items.push({ label: p, rel: acc });
		}
		return items;
	}, [dir]);

	const allowPick = allowPickKinds ? new Set(allowPickKinds) : null;

	const handleUploadFiles = async (files: File[]) => {
		if (!files.length) return;
		setUploading(true);
		setError(null);
		try {
			await uploadFiles(dir, files);
			await reload(dir);
		} catch (e) {
			setError(errorMessage(e, 'Не удалось загрузить файлы'));
		} finally {
			setUploading(false);
		}
	};

	const handleDropUpload: React.DragEventHandler<HTMLDivElement> = async (e) => {
		e.preventDefault();
		const files = Array.from(e.dataTransfer.files ?? []);
		await handleUploadFiles(files);
	};

	const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
		e.preventDefault();
	};

	const handleCreateFolder = async () => {
		const name = newFolderName.trim();
		if (!name) return;
		try {
			setError(null);
			await mkdir(dir, name);
			setNewFolderName('');
			setCreatingFolder(false);
			await reload(dir);
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
			await uploadByUrl(dir, url);
			setUrlToUpload('');
			await reload(dir);
		} catch (e) {
			setError(errorMessage(e, 'Не удалось загрузить по URL'));
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async (relPath: string) => {
		try {
			setError(null);
			await deletePath(relPath);
			await reload(dir);
		} catch (e) {
			setError(errorMessage(e, 'Не удалось удалить'));
		}
	};

	const onDragEnd = async (evt: DragEndEvent) => {
		const from = String(evt.active.id);
		const over = evt.over?.id ? String(evt.over.id) : '';
		if (!over.startsWith('dir:')) return;
		const toDir = over.slice('dir:'.length);
		if (toDir === relDirOf(from)) return;

		try {
			setError(null);
			await movePath(from, toDir);
			await reload(dir);
		} catch (e) {
			setError(errorMessage(e, 'Не удалось переместить'));
		}
	};

	return (
		<DndContext sensors={sensors} onDragEnd={(e) => void onDragEnd(e)}>
			<div className="grid grid-cols-[280px_1fr] gap-4">
				<aside className="bg-white border-2 border-blue-100 rounded-2xl p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="text-blue-800 font-bold">Папки</div>
						<AdminButton size="sm" onClick={() => void reload(dir)}>
							⟳
						</AdminButton>
					</div>

					<TreeRoot currentDir={dir} onNavigate={(d) => void reload(d)} />
				</aside>

				<section className="bg-white border-2 border-blue-100 rounded-2xl p-4 min-h-[420px]">
					<div className="flex flex-col gap-3">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div className="flex flex-wrap items-center gap-2">
								{breadcrumbs.map((b, i) => (
									<button
										key={b.rel || 'root'}
										type="button"
										onClick={() => void reload(b.rel)}
										className={`text-sm font-semibold ${
											i === breadcrumbs.length - 1
												? 'text-blue-900'
												: 'text-blue-600 hover:text-blue-800'
										}`}
									>
										{i === 0 ? b.label : `/${b.label}`}
									</button>
								))}
							</div>

							<div className="flex items-center gap-2">
								<AdminButton
									size="sm"
									variant="secondary"
									onClick={() => setCreatingFolder((v) => !v)}
								>
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
									onChange={(e) =>
										void handleUploadFiles(Array.from(e.target.files ?? []))
									}
								/>
							</div>
						</div>

						{creatingFolder && (
							<div className="flex flex-wrap items-end gap-2 rounded-2xl border-2 border-blue-50 bg-blue-50/40 p-3">
								<label className="flex-1 min-w-64">
									<div className="text-xs font-semibold text-blue-700 mb-1">
										Новая папка
									</div>
									<input
										className={adminInputClass}
										value={newFolderName}
										onChange={(e) => setNewFolderName(e.target.value)}
										placeholder="например: rectors"
									/>
								</label>
								<AdminButton
									size="sm"
									variant="primary"
									onClick={() => void handleCreateFolder()}
								>
									Создать
								</AdminButton>
							</div>
						)}

						<div className="flex flex-wrap items-end gap-2 rounded-2xl border-2 border-blue-50 bg-blue-50/40 p-3">
							<label className="flex-1 min-w-64">
								<div className="text-xs font-semibold text-blue-700 mb-1">
									Загрузка по URL
								</div>
								<input
									className={adminInputClass}
									value={urlToUpload}
									onChange={(e) => setUrlToUpload(e.target.value)}
									placeholder="https://..."
								/>
							</label>
							<AdminButton
								size="sm"
								variant="secondary"
								disabled={uploading}
								onClick={() => void handleUploadByUrl()}
							>
								Скачать
							</AdminButton>
						</div>

						{error && (
							<div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-2">
								{error}
							</div>
						)}

						<div
							onDrop={(e) => void handleDropUpload(e)}
							onDragOver={handleDragOver}
							className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-4"
						>
							<div className="text-sm text-blue-800 font-semibold">
								Файлы в текущей папке
							</div>
							<div className="text-xs text-blue-500 mt-1">
								Можно перетащить файлы сюда для загрузки (desktop). Для перемещения внутри
								дерева используйте drag-and-drop по папкам.
							</div>

							<div className="mt-3">
								{loading ? (
									<div className="text-blue-600">Загрузка…</div>
								) : entries.length === 0 ? (
									<div className="text-gray-400 text-sm">Папка пустая.</div>
								) : (
									<div className="flex flex-col gap-2">
										{parentDir !== dir && (
											<button
												type="button"
												onClick={() => void reload(parentDir)}
												className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100 hover:bg-blue-50 text-left"
											>
												<span className="text-blue-700">↩</span>
												<span className="text-sm text-blue-800 font-semibold">..</span>
											</button>
										)}
										{entries.map((e) => (
											<EntryRow
												key={e.relPath}
												entry={e}
												onNavigate={(d) => void reload(d)}
												onDelete={() => void handleDelete(e.relPath)}
												onRename={async (newName) => {
													const res = await renamePath(e.relPath, newName);
													await reload(relDirOf(res.path));
												}}
												onPick={
													onPick && (!allowPick || allowPick.has(e.kind))
														? (url) => onPick(url, e)
														: undefined
												}
											/>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</section>
			</div>
		</DndContext>
	);
}

function EntryRow({
	entry,
	onNavigate,
	onDelete,
	onRename,
	onPick,
}: {
	entry: FileManagerEntry;
	onNavigate: (dir: string) => void;
	onDelete: () => void;
	onRename: (newName: string) => Promise<void>;
	onPick?: (url: string) => void;
}) {
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState(entry.name);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		setName(entry.name);
		setRenaming(false);
		setBusy(false);
	}, [entry.name, entry.relPath]);

	const isFolder = entry.kind === 'dir';
	const url = `/images/${entry.relPath}`;

	const drag = useDraggable({ id: entry.relPath });
	const drop = useDroppable({ id: `dir:${entry.relPath}` });

	const handleOpen = () => {
		if (!isFolder) return;
		onNavigate(entry.relPath);
	};

	return (
		<div
			ref={drag.setNodeRef}
			{...drag.listeners}
			{...drag.attributes}
			className={`flex items-center gap-3 px-3 py-2 rounded-xl border border-blue-100 bg-white hover:bg-blue-50 transition-all ${
				drag.isDragging ? 'opacity-60' : ''
			}`}
		>
			<div className="w-8 text-center shrink-0">{isFolder ? '📁' : '📄'}</div>

			<div className="flex-1 min-w-0">
				{renaming ? (
					<div className="flex items-center gap-2">
						<input
							className={adminInputClass}
							value={name}
							onChange={(e) => setName(e.target.value)}
							autoFocus
						/>
						<AdminButton
							size="sm"
							variant="primary"
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
						<AdminButton size="sm" variant="secondary" onClick={() => setRenaming(false)}>
							Отмена
						</AdminButton>
					</div>
				) : (
					<button
						type="button"
						onClick={handleOpen}
						className={`w-full text-left text-sm font-semibold truncate ${
							isFolder ? 'text-blue-800' : 'text-gray-800'
						}`}
					>
						{entry.name}
					</button>
				)}
				{!isFolder && (
					<div className="text-xs text-gray-400 truncate">{url}</div>
				)}
			</div>

			<div className="flex items-center gap-2 shrink-0">
				{onPick && !isFolder && (
					<AdminButton size="sm" variant="primary" onClick={() => onPick(url)}>
						Выбрать
					</AdminButton>
				)}
				{isFolder && (
					<FolderDropTarget active={drop.isOver} setNodeRef={drop.setNodeRef} />
				)}
				<AdminButton size="sm" variant="secondary" onClick={() => setRenaming(true)}>
					Переимен.
				</AdminButton>
				<AdminButton size="sm" variant="danger" onClick={onDelete}>
					Удалить
				</AdminButton>
			</div>
		</div>
	);
}

function FolderDropTarget({
	active,
	setNodeRef,
}: {
	active: boolean;
	setNodeRef: (el: HTMLElement | null) => void;
}) {
	return (
		<div
			ref={setNodeRef}
			className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
				active ? 'bg-blue-700 text-white border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-100'
			}`}
		>
			Drop
		</div>
	);
}

function TreeRoot({
	currentDir,
	onNavigate,
}: {
	currentDir: string;
	onNavigate: (dir: string) => void;
}) {
	return (
		<div className="flex flex-col gap-1">
			<TreeNode rel="" label="images" currentDir={currentDir} onNavigate={onNavigate} />
		</div>
	);
}

function TreeNode({
	rel,
	label,
	currentDir,
	onNavigate,
}: {
	rel: string;
	label: string;
	currentDir: string;
	onNavigate: (dir: string) => void;
}) {
	const [open, setOpen] = useState(true);
	const [loading, setLoading] = useState(false);
	const [childDirs, setChildDirs] = useState<FileManagerEntry[]>([]);

	const active = currentDir === rel || (rel !== '' && currentDir.startsWith(`${rel}/`));

	const droppable = useDroppable({ id: `dir:${rel}` });

	const loadChildren = async () => {
		setLoading(true);
		try {
			const res = await fetchFilesIndex(rel);
			setChildDirs(res.entries.filter(isDir));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!open) return;
		void loadChildren();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, rel]);

	return (
		<div className="select-none">
			<div
				ref={droppable.setNodeRef}
				className={`flex items-center gap-2 px-2 py-1.5 rounded-xl border ${
					active ? 'border-blue-300 bg-blue-50' : 'border-transparent hover:bg-blue-50'
				}`}
			>
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					className="w-6 h-6 rounded-lg border border-blue-100 bg-white text-blue-700 text-xs font-bold"
				>
					{open ? '–' : '+'}
				</button>
				<button
					type="button"
					onClick={() => onNavigate(rel)}
					className={`flex-1 text-left text-sm font-semibold ${
						active ? 'text-blue-900' : 'text-blue-700'
					}`}
				>
					{label}
				</button>
				{droppable.isOver && (
					<span className="text-[10px] font-bold text-white bg-blue-700 rounded-md px-1.5 py-0.5">
						DROP
					</span>
				)}
			</div>

			{open && (
				<div className="ml-6 mt-1 flex flex-col gap-1">
					{loading ? (
						<div className="text-xs text-gray-400 px-2">Загрузка…</div>
					) : childDirs.length === 0 ? (
						<div className="text-xs text-gray-400 px-2">Нет подпапок</div>
					) : (
						childDirs.map((d) => (
							<TreeNode
								key={d.relPath}
								rel={d.relPath}
								label={baseNameOf(d.relPath)}
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


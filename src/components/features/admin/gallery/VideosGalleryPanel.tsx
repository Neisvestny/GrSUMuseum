import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
	createGalleryVideo,
	deleteGalleryVideo,
	fetchGalleryVideos,
	reorderGalleryVideos,
	updateGalleryVideo,
	type GalleryVideo,
} from '../../../../api/gallery';
import { ApiError } from '../../../../shared/api/client';
import AdminButton from '../ui/AdminButton';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';
import FilePathInput from '../ui/FilePathInput';
import { useAdminToast } from '../ui/AdminToastContext';

function errorMessage(error: unknown, fallback: string): string {
	return error instanceof ApiError ? error.message : fallback;
}

export default function VideosGalleryPanel() {
	const toast = useAdminToast();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [videos, setVideos] = useState<GalleryVideo[]>([]);
	const [items, setItems] = useState<GalleryVideo[]>([]);

	const [creating, setCreating] = useState(false);
	const [form, setForm] = useState<Partial<GalleryVideo>>({
		src: '',
		title: '',
		description: '',
		tags: [],
		duration: '',
		is_external: true,
	});
	const [tagsText, setTagsText] = useState('');

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

	const reload = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await fetchGalleryVideos();
			setVideos(data);
			setItems(data);
		} catch (e) {
			const msg = errorMessage(e, 'Не удалось загрузить видеогалерею');
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void reload();
	}, []);

	useEffect(() => {
		setItems(videos);
	}, [videos]);

	const submitCreate = async () => {
		try {
			const tags = tagsText
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
			await createGalleryVideo({
				...form,
				tags,
				duration: form.duration ? String(form.duration) : null,
			});
			setCreating(false);
			setForm({
				src: '',
				title: '',
				description: '',
				tags: [],
				duration: '',
				is_external: true,
			});
			setTagsText('');
			await reload();
			toast.success('Видео добавлено');
		} catch (e) {
			toast.error(errorMessage(e, 'Не удалось добавить видео'));
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<AdminButton size="md" variant="primary" onClick={() => setCreating((v) => !v)}>
					{creating ? '✕ Отмена' : '+ Добавить видео'}
				</AdminButton>
				<AdminButton size="md" variant="secondary" onClick={() => void reload()}>
					⟳ Обновить
				</AdminButton>
			</div>

			{creating && (
				<div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col gap-3">
					<div className="text-blue-800 font-bold">Новое видео</div>
					<FilePathInput
						label="src (URL или файл)"
						value={String(form.src ?? '')}
						onChange={(next) => setForm((f) => ({ ...f, src: next }))}
						placeholder={form.is_external ? 'https://youtube.com/...' : '/images/video.mp4'}
					/>
					<label className="flex items-center gap-2 text-sm font-semibold text-blue-800">
						<input
							type="checkbox"
							checked={Boolean(form.is_external)}
							onChange={(e) => setForm((f) => ({ ...f, is_external: e.target.checked }))}
						/>
						Внешнее видео (embed)
					</label>
					<label>
						<span className={adminLabelClass}>title</span>
						<input
							className={adminInputClass}
							value={String(form.title ?? '')}
							onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
						/>
					</label>
					<label>
						<span className={adminLabelClass}>description</span>
						<textarea
							className={adminInputClass + ' resize-y min-h-20'}
							value={String(form.description ?? '')}
							onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
						/>
					</label>
					<label>
						<span className={adminLabelClass}>tags (через запятую)</span>
						<input
							className={adminInputClass}
							value={tagsText}
							onChange={(e) => setTagsText(e.target.value)}
							placeholder="спорт, интервью, ..."
						/>
					</label>
					<label className="max-w-xs">
						<span className={adminLabelClass}>duration</span>
						<input
							className={adminInputClass}
							value={String(form.duration ?? '')}
							onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
							placeholder="03:12"
						/>
					</label>
					<AdminButton size="md" variant="primary" onClick={() => void submitCreate()}>
						Создать
					</AdminButton>
				</div>
			)}

			{loading && <div className="text-center text-blue-600 py-8">Загрузка…</div>}
			{error && <div className="text-center text-red-500 py-8">{error}</div>}

			{!loading && !error && (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={(evt) => {
						const activeId = evt.active.id as number;
						const overId = evt.over?.id as number | undefined;
						if (!overId || activeId === overId) return;
						const oldIndex = items.findIndex((v) => v.id === activeId);
						const newIndex = items.findIndex((v) => v.id === overId);
						if (oldIndex < 0 || newIndex < 0) return;
						const next = arrayMove(items, oldIndex, newIndex);
						setItems(next);
						void reorderGalleryVideos(next.map((v) => v.id))
							.then(() => reload())
							.catch((e) =>
								toast.error(
									e instanceof Error ? e.message : 'Не удалось сохранить порядок',
								),
							);
					}}
				>
					<SortableContext
						items={items.map((v) => v.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className="flex flex-col gap-2">
							{items.map((v) => (
								<SortableVideoRow
									key={v.id}
									video={v}
									onUpdate={async (id, data) => {
										await updateGalleryVideo(id, data);
										await reload();
									}}
									onDelete={async (id) => {
										await deleteGalleryVideo(id);
										await reload();
									}}
								/>
							))}
							{items.length === 0 && (
								<div className="text-gray-400 text-sm">Видео пока нет.</div>
							)}
						</div>
					</SortableContext>
				</DndContext>
			)}
		</div>
	);
}

function SortableVideoRow({
	video,
	onUpdate,
	onDelete,
}: {
	video: GalleryVideo;
	onUpdate: (id: number, data: Partial<GalleryVideo>) => Promise<void>;
	onDelete: (id: number) => Promise<void>;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: video.id,
	});
	const style = { transform: CSS.Transform.toString(transform), transition };
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState<GalleryVideo>(video);
	const [tagsText, setTagsText] = useState(video.tags.join(', '));

	useEffect(() => {
		setForm(video);
		setTagsText(video.tags.join(', '));
	}, [video]);

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`rounded-2xl border-2 border-blue-100 bg-white p-3 ${isDragging ? 'opacity-70' : ''}`}
		>
			<div className="flex items-center gap-3">
				<button
					type="button"
					className="p-2 rounded-xl border-2 border-blue-100 text-blue-500 hover:bg-blue-50 active:scale-95 transition-all touch-none"
					{...attributes}
					{...listeners}
					aria-label="Перетащить"
				>
					<GripVertical className="w-4 h-4" />
				</button>
				<div className="flex-1 min-w-0">
					<div className="text-sm font-semibold text-blue-800 truncate">{video.title}</div>
					<div className="text-xs text-gray-400 truncate">{video.src}</div>
				</div>
				<AdminButton size="sm" variant="secondary" onClick={() => setEditing((v) => !v)}>
					{editing ? 'Свернуть' : 'Правка'}
				</AdminButton>
				<AdminButton size="sm" variant="danger" onClick={() => void onDelete(video.id)}>
					Удалить
				</AdminButton>
			</div>

			{editing && (
				<div className="mt-3 grid grid-cols-2 gap-2">
					<FilePathInput
						label="src"
						value={form.src}
						onChange={(next) => setForm((f) => ({ ...f, src: next }))}
					/>
					<label className="flex items-center gap-2 text-sm font-semibold text-blue-800">
						<input
							type="checkbox"
							checked={Boolean(form.is_external)}
							onChange={(e) =>
								setForm((f) => ({ ...f, is_external: e.target.checked }))
							}
						/>
						is_external
					</label>
					<label>
						<span className={adminLabelClass}>title</span>
						<input
							className={adminInputClass}
							value={form.title}
							onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
						/>
					</label>
					<label>
						<span className={adminLabelClass}>duration</span>
						<input
							className={adminInputClass}
							value={form.duration ?? ''}
							onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
						/>
					</label>
					<label className="col-span-2">
						<span className={adminLabelClass}>description</span>
						<textarea
							className={adminInputClass + ' resize-y min-h-20'}
							value={form.description}
							onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
						/>
					</label>
					<label className="col-span-2">
						<span className={adminLabelClass}>tags</span>
						<input
							className={adminInputClass}
							value={tagsText}
							onChange={(e) => setTagsText(e.target.value)}
						/>
					</label>
					<div className="col-span-2">
						<AdminButton
							size="sm"
							variant="primary"
							onClick={() =>
								void onUpdate(video.id, {
									...form,
									tags: tagsText
										.split(',')
										.map((t) => t.trim())
										.filter(Boolean),
									duration: form.duration ? form.duration : null,
								})
							}
						>
							Сохранить
						</AdminButton>
					</div>
				</div>
			)}
		</div>
	);
}


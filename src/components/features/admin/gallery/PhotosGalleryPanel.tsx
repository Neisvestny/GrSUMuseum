import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
	createGalleryPhoto,
	deleteGalleryPhoto,
	fetchGalleryPhotos,
	reorderGalleryPhotos,
	updateGalleryPhoto,
	type GalleryPhoto,
} from '../../../../api/gallery';
import { ApiError } from '../../../../shared/api/client';
import AdminButton from '../ui/AdminButton';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';
import ImagePathInput from '../ui/ImagePathInput';
import { useAdminToast } from '../ui/AdminToastContext';

function errorMessage(error: unknown, fallback: string): string {
	return error instanceof ApiError ? error.message : fallback;
}

type YearGroup = { year: number; photos: GalleryPhoto[] };

function groupByYear(photos: GalleryPhoto[]): YearGroup[] {
	const map = new Map<number, GalleryPhoto[]>();
	for (const p of photos) {
		map.set(p.year, [...(map.get(p.year) ?? []), p]);
	}
	return Array.from(map.entries())
		.map(([year, list]) => ({
			year,
			photos: [...list].sort((a, b) => a.position - b.position),
		}))
		.sort((a, b) => a.year - b.year);
}

export default function PhotosGalleryPanel() {
	const toast = useAdminToast();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

	const [creating, setCreating] = useState(false);
	const [form, setForm] = useState<Partial<GalleryPhoto>>({
		src: '',
		title: '',
		annotation: '',
		year: new Date().getFullYear(),
	});

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

	const reload = async () => {
		try {
			setLoading(true);
			setError(null);
			setPhotos(await fetchGalleryPhotos());
		} catch (e) {
			const msg = errorMessage(e, 'Не удалось загрузить фотогалерею');
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void reload();
	}, []);

	const groups = useMemo(() => groupByYear(photos), [photos]);

	const submitCreate = async () => {
		try {
			await createGalleryPhoto(form);
			setCreating(false);
			setForm({
				src: '',
				title: '',
				annotation: '',
				year: new Date().getFullYear(),
			});
			await reload();
			toast.success('Фото добавлено');
		} catch (e) {
			toast.error(errorMessage(e, 'Не удалось добавить фото'));
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<AdminButton size="md" variant="primary" onClick={() => setCreating((v) => !v)}>
					{creating ? '✕ Отмена' : '+ Добавить фото'}
				</AdminButton>
				<AdminButton size="md" variant="secondary" onClick={() => void reload()}>
					⟳ Обновить
				</AdminButton>
			</div>

			{creating && (
				<div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col gap-3">
					<div className="text-blue-800 font-bold">Новая фотография</div>
					<ImagePathInput
						label="Файл"
						value={String(form.src ?? '')}
						onChange={(next) => setForm((f) => ({ ...f, src: next }))}
						placeholder="gallery/1900/photo.jpg"
					/>
					<label>
						<span className={adminLabelClass}>Заголовок</span>
						<input
							className={adminInputClass}
							value={String(form.title ?? '')}
							onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
						/>
					</label>
					<label>
						<span className={adminLabelClass}>Аннотация</span>
						<textarea
							className={adminInputClass + ' resize-y min-h-20'}
							value={String(form.annotation ?? '')}
							onChange={(e) => setForm((f) => ({ ...f, annotation: e.target.value }))}
						/>
					</label>
					<label className="max-w-xs">
						<span className={adminLabelClass}>Год</span>
						<input
							type="number"
							className={adminInputClass}
							value={Number(form.year ?? 0)}
							onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
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
				<div className="flex flex-col gap-6">
					{groups.map((g) => (
						<YearSortableBlock
							key={g.year}
							year={g.year}
							photos={g.photos}
							sensors={sensors}
							onReorder={async (ordered) => {
								await reorderGalleryPhotos(g.year, ordered);
								await reload();
							}}
							onUpdate={async (id, data) => {
								await updateGalleryPhoto(id, data);
								await reload();
							}}
							onDelete={async (id) => {
								await deleteGalleryPhoto(id);
								await reload();
							}}
						/>
					))}
					{groups.length === 0 && (
						<div className="text-gray-400 text-sm">Фотографий пока нет.</div>
					)}
				</div>
			)}
		</div>
	);
}

function YearSortableBlock({
	year,
	photos,
	sensors,
	onReorder,
	onUpdate,
	onDelete,
}: {
	year: number;
	photos: GalleryPhoto[];
	sensors: ReturnType<typeof useSensors>;
	onReorder: (orderedIds: number[]) => Promise<void>;
	onUpdate: (id: number, data: Partial<GalleryPhoto>) => Promise<void>;
	onDelete: (id: number) => Promise<void>;
}) {
	const toast = useAdminToast();
	const [items, setItems] = useState(photos);

	useEffect(() => setItems(photos), [photos]);

	return (
		<div className="bg-white border-2 border-blue-100 rounded-2xl p-4">
			<div className="flex items-center justify-between mb-3">
				<div className="text-blue-800 font-bold">{year}</div>
				<div className="text-xs text-gray-400">{items.length} фото</div>
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={(evt) => {
					const activeId = evt.active.id as number;
					const overId = evt.over?.id as number | undefined;
					if (!overId || activeId === overId) return;
					const oldIndex = items.findIndex((p) => p.id === activeId);
					const newIndex = items.findIndex((p) => p.id === overId);
					if (oldIndex < 0 || newIndex < 0) return;
					const next = arrayMove(items, oldIndex, newIndex);
					setItems(next);
					void onReorder(next.map((p) => p.id)).catch((e) =>
						toast.error(e instanceof Error ? e.message : 'Не удалось сохранить порядок'),
					);
				}}
			>
				<SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
					<div className="flex flex-col gap-2">
						{items.map((p) => (
							<SortablePhotoRow
								key={p.id}
								photo={p}
								onUpdate={onUpdate}
								onDelete={onDelete}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
}

function SortablePhotoRow({
	photo,
	onUpdate,
	onDelete,
}: {
	photo: GalleryPhoto;
	onUpdate: (id: number, data: Partial<GalleryPhoto>) => Promise<void>;
	onDelete: (id: number) => Promise<void>;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: photo.id,
	});
	const style = { transform: CSS.Transform.toString(transform), transition };
	const [editing, setEditing] = useState(false);
	const [form, setForm] = useState<GalleryPhoto>(photo);

	useEffect(() => setForm(photo), [photo]);

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
				<div className="w-16 h-12 rounded-xl overflow-hidden border border-blue-100 bg-blue-50 shrink-0">
					<img src={photo.src} alt="" className="w-full h-full object-cover" />
				</div>
				<div className="flex-1 min-w-0">
					<div className="text-sm font-semibold text-blue-800 truncate">{photo.title}</div>
					<div className="text-xs text-gray-400 truncate">{photo.src}</div>
				</div>
				<AdminButton size="sm" variant="secondary" onClick={() => setEditing((v) => !v)}>
					{editing ? 'Свернуть' : 'Правка'}
				</AdminButton>
				<AdminButton size="sm" variant="danger" onClick={() => void onDelete(photo.id)}>
					Удалить
				</AdminButton>
			</div>

			{editing && (
				<div className="mt-3 grid grid-cols-2 gap-2">
					<ImagePathInput
						label="src"
						value={form.src}
						onChange={(next) => setForm((f) => ({ ...f, src: next }))}
					/>
					<label>
						<span className={adminLabelClass}>Год</span>
						<input
							type="number"
							className={adminInputClass}
							value={form.year}
							onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
						/>
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
						<span className={adminLabelClass}>position</span>
						<input
							type="number"
							className={adminInputClass}
							value={form.position}
							onChange={(e) =>
								setForm((f) => ({ ...f, position: Number(e.target.value) }))
							}
						/>
					</label>
					<label className="col-span-2">
						<span className={adminLabelClass}>annotation</span>
						<textarea
							className={adminInputClass + ' resize-y min-h-20'}
							value={form.annotation}
							onChange={(e) => setForm((f) => ({ ...f, annotation: e.target.value }))}
						/>
					</label>
					<div className="col-span-2">
						<AdminButton
							size="sm"
							variant="primary"
							onClick={() => void onUpdate(photo.id, form)}
						>
							Сохранить
						</AdminButton>
					</div>
				</div>
			)}
		</div>
	);
}


import { useEffect, useMemo, useState } from 'react';
import {
	createBlock,
	createPage,
	createParagraph,
	CONTENT_TEMPLATES,
	createTab,
	deleteBlock,
	deletePage,
	deleteParagraph,
	deleteTab,
	fetchPageById,
	fetchPages,
	PAGE_TEMPLATES,
	updateBlock,
	updatePage,
	updateParagraph,
	updateTab,
	type PageBlock,
	type PageDto,
	type ContentTemplate,
	type PageSummary,
	type PageTab,
	type PageTemplate,
} from '../../../../api/pages';
import { ApiError } from '../../../../shared/api/client';
import AdminButton from '../ui/AdminButton';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';
import ImagePathInput from '../ui/ImagePathInput';
import { useAdminToast } from '../ui/AdminToastContext';
import { ErrorBox } from '../ui/ErrorBox';
import type { MediaItem } from '../../../../api/pages';
import MediaBrowserModal from '../media/MediaBrowserModal';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	horizontalListSortingStrategy,
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

function errorMessage(error: unknown, fallback: string): string {
	return error instanceof ApiError ? error.message : fallback;
}

export default function PagesPanel() {
	const toast = useAdminToast();
	const [pages, setPages] = useState<PageSummary[]>([]);
	const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
	const [selectedPage, setSelectedPage] = useState<PageDto | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [newPageSlug, setNewPageSlug] = useState('');
	const [newPageTitle, setNewPageTitle] = useState('');
	const [newPageTemplate, setNewPageTemplate] = useState<PageTemplate>('tabs_alternating');
	/** В какую вкладку кладём новый блок (если вкладки есть). */
	const [newBlockTabId, setNewBlockTabId] = useState<number | null>(null);

	const loadPages = async () => {
		try {
			setLoading(true);
			setError(null);
			const list = await fetchPages();
			setPages(list);
			if (list.length === 0) {
				setSelectedPageId(null);
				setSelectedPage(null);
				return;
			}
			const nextId =
				selectedPageId && list.some((p) => p.id === selectedPageId)
					? selectedPageId
					: list[0].id;
			setSelectedPageId(nextId);
		} catch (error) {
			const msg = errorMessage(error, 'Не удалось загрузить список страниц');
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	};

	const loadPage = async (pageId: number) => {
		try {
			setError(null);
			setSelectedPage(await fetchPageById(pageId));
		} catch (error) {
			const msg = errorMessage(error, 'Не удалось загрузить данные страницы');
			setError(msg);
			toast.error(msg);
			setSelectedPage(null);
		}
	};

	useEffect(() => {
		void loadPages();
	}, []);

	useEffect(() => {
		if (selectedPageId !== null) {
			void loadPage(selectedPageId);
		}
	}, [selectedPageId]);

	const tabs = selectedPage?.tabs ?? [];

	useEffect(() => {
		if (tabs.length === 0) {
			setNewBlockTabId(null);
			return;
		}
		setNewBlockTabId((prev) => {
			if (prev !== null && tabs.some((t) => t.id === prev)) return prev;
			return tabs[0]?.id ?? null;
		});
	}, [selectedPageId, tabs]);
	const directBlocks = selectedPage?.blocks ?? [];

	const allBlocks = useMemo(
		() => [
			...directBlocks.map((block) => ({ block, parentLabel: 'Страница' })),
			...tabs.flatMap((tab) =>
				tab.blocks.map((block) => ({ block, parentLabel: `Вкладка: ${tab.label}` })),
			),
		],
		[directBlocks, tabs],
	);

	const createNewPage = async () => {
		try {
			const page = await createPage({
				slug: newPageSlug,
				title: newPageTitle,
				template: newPageTemplate,
			});
			setNewPageSlug('');
			setNewPageTitle('');
			setNewPageTemplate('tabs_alternating');
			setCreating(false);
			await loadPages();
			setSelectedPageId(page.id);
			toast.success('Страница создана');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось создать страницу'));
		}
	};

	const savePageMeta = async (
		id: number,
		data: { slug?: string; title?: string; template?: PageTemplate; media?: MediaItem[] },
	) => {
		try {
			await updatePage(id, data);
			await loadPages();
			await loadPage(id);
			toast.success('Страница сохранена');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось сохранить страницу'));
		}
	};

	const removePage = async (id: number) => {
		try {
			await deletePage(id);
			await loadPages();
			toast.success('Страница удалена');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось удалить страницу'));
		}
	};

	const addTab = async () => {
		if (!selectedPageId) return;
		try {
			await createTab(selectedPageId, { label: 'Новая вкладка' });
			await loadPage(selectedPageId);
			toast.success('Вкладка добавлена');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось добавить вкладку'));
		}
	};

	const saveTab = async (
		tabId: number,
		data: { label?: string; position?: number; template?: ContentTemplate | null },
	) => {
		if (!selectedPageId) return;
		try {
			await updateTab(tabId, data);
			await loadPage(selectedPageId);
			toast.success('Вкладка сохранена');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось сохранить вкладку'));
		}
	};

	const removeTab = async (tabId: number) => {
		if (!selectedPageId) return;
		try {
			await deleteTab(tabId);
			await loadPage(selectedPageId);
			toast.success('Вкладка удалена');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось удалить вкладку'));
		}
	};

	const addBlockToPage = async () => {
		if (!selectedPageId) return;
		try {
			await createBlock({ page_id: selectedPageId, img: '' });
			await loadPage(selectedPageId);
			toast.success('Блок добавлен на страницу');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось добавить блок страницы'));
		}
	};

	const addBlockToTab = async (tabId: number) => {
		if (!selectedPageId) return;
		try {
			await createBlock({ tab_id: tabId, img: '' });
			await loadPage(selectedPageId);
			toast.success('Блок добавлен');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось добавить блок'));
		}
	};

	const addBlockDefault = async () => {
		if (!selectedPageId) return;
		if (tabs.length > 0 && newBlockTabId !== null) {
			await addBlockToTab(newBlockTabId);
		} else {
			await addBlockToPage();
		}
	};

	const saveBlock = async (
		blockId: number,
		data: { img?: string | null; position?: number; template?: ContentTemplate | null },
	) => {
		if (!selectedPageId) return;
		try {
			await updateBlock(blockId, data);
			await loadPage(selectedPageId);
		} catch (error) {
			setError(errorMessage(error, 'Не удалось сохранить блок'));
		}
	};

	const removeBlock = async (blockId: number) => {
		if (!selectedPageId) return;
		try {
			await deleteBlock(blockId);
			await loadPage(selectedPageId);
			toast.success('Блок удалён');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось удалить блок'));
		}
	};

	const addParagraph = async (blockId: number) => {
		if (!selectedPageId) return;
		try {
			await createParagraph(blockId, { text: 'Новый абзац' });
			await loadPage(selectedPageId);
			toast.success('Абзац добавлен');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось добавить абзац'));
		}
	};

	const saveParagraph = async (
		paragraphId: number,
		data: { text?: string; position?: number },
	) => {
		if (!selectedPageId) return;
		try {
			await updateParagraph(paragraphId, data);
			await loadPage(selectedPageId);
			toast.success('Абзац сохранён');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось сохранить абзац'));
		}
	};

	const removeParagraph = async (paragraphId: number) => {
		if (!selectedPageId) return;
		try {
			await deleteParagraph(paragraphId);
			await loadPage(selectedPageId);
			toast.success('Абзац удалён');
		} catch (error) {
			toast.error(errorMessage(error, 'Не удалось удалить абзац'));
		}
	};

	return (
		<div className="grid grid-cols-[300px_1fr] gap-4">
			<div className="bg-white border-2 border-blue-100 rounded-2xl p-4">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-blue-800 font-bold">Страницы</h3>
					<AdminButton size="sm" variant="primary" onClick={() => setCreating((v) => !v)}>
						{creating ? '✕' : '+'}
					</AdminButton>
				</div>
				{creating && (
					<div className="mb-3 flex flex-col gap-2">
						<input
							className={adminInputClass}
							placeholder="slug: history/memory/vov"
							value={newPageSlug}
							onChange={(e) => setNewPageSlug(e.target.value)}
						/>
						<input
							className={adminInputClass}
							placeholder="Заголовок страницы"
							value={newPageTitle}
							onChange={(e) => setNewPageTitle(e.target.value)}
						/>
						<select
							className={adminInputClass}
							value={newPageTemplate}
							onChange={(e) => setNewPageTemplate(e.target.value as PageTemplate)}
						>
							{PAGE_TEMPLATES.map((template) => (
								<option key={template.value} value={template.value}>
									{template.label}
								</option>
							))}
						</select>
						<AdminButton
							size="sm"
							variant="primary"
							onClick={() => void createNewPage()}
						>
							Создать
						</AdminButton>
					</div>
				)}

				<div className="flex flex-col gap-2 max-h-[65vh] overflow-y-auto">
					{pages.map((page) => (
						<button
							key={page.id}
							onClick={() => setSelectedPageId(page.id)}
							className={`w-full rounded-xl border-2 p-2 text-left ${
								page.id === selectedPageId
									? 'border-blue-700 bg-blue-50'
									: 'border-blue-100 hover:border-blue-300'
							}`}
						>
							<div className="text-xs text-gray-400">/{page.slug}</div>
							<div className="text-sm text-blue-800 font-semibold">{page.title}</div>
							<div className="text-xs text-blue-500 mt-0.5">
								{templateLabel(page.template)}
							</div>
						</button>
					))}
				</div>
			</div>

			<div className="bg-white border-2 border-blue-100 rounded-2xl p-4 min-h-[420px]">
				{loading && <div className="text-blue-600">Загрузка...</div>}
				{error && (
					<div className="mb-4">
						<ErrorBox msg={error} />
					</div>
				)}
				{!loading && !selectedPage && (
					<div className="text-gray-500">Выберите страницу слева.</div>
				)}

				{selectedPage && (
					<div className="flex flex-col gap-6">
						<PageMetaCard
							page={selectedPage}
							onSave={savePageMeta}
							onDelete={removePage}
						/>

						<div className="border-2 border-blue-50 rounded-xl p-3">
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-semibold text-blue-800">Вкладки</h4>
								<AdminButton size="sm" onClick={() => void addTab()}>
									+ Вкладка
								</AdminButton>
							</div>
							<div className="flex flex-col gap-2">
								{tabs.map((tab) => (
									<div
										key={tab.id}
										className="border border-blue-100 rounded-xl p-2"
									>
										<TabEditor
											tab={tab}
											maxPos={tabs.length}
											onSave={(data) => saveTab(tab.id, data)}
											onDelete={() => removeTab(tab.id)}
										/>
									</div>
								))}
								{tabs.length === 0 && (
									<div className="text-gray-400 text-sm">
										У страницы пока нет вкладок.
									</div>
								)}
							</div>
						</div>

						<div className="border-2 border-blue-50 rounded-xl p-3">
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
								<h4 className="font-semibold text-blue-800">Блоки</h4>
								<div className="flex flex-wrap items-center gap-2">
									{tabs.length > 0 && newBlockTabId !== null && (
										<label className="flex items-center gap-2 text-sm text-blue-800">
											<span className={adminLabelClass}>Во вкладку</span>
											<select
												className={`${adminInputClass} min-w-40`}
												value={newBlockTabId}
												onChange={(e) =>
													setNewBlockTabId(Number(e.target.value))
												}
											>
												{tabs.map((tab) => (
													<option key={tab.id} value={tab.id}>
														{tab.label}
													</option>
												))}
											</select>
										</label>
									)}
									<AdminButton
										size="sm"
										variant="primary"
										onClick={() => void addBlockDefault()}
									>
										+ Блок
									</AdminButton>
									{tabs.length > 0 && (
										<AdminButton
											size="sm"
											variant="secondary"
											onClick={() => void addBlockToPage()}
										>
											На страницу (без вкладки)
										</AdminButton>
									)}
								</div>
							</div>
							<div className="flex flex-col gap-3">
								{allBlocks.map(({ block, parentLabel }) => (
									<BlockEditor
										key={block.id}
										block={block}
										parentLabel={parentLabel}
										maxPos={100}
										onSave={(data) => saveBlock(block.id, data)}
										onDelete={() => removeBlock(block.id)}
										onAddParagraph={() => addParagraph(block.id)}
										onSaveParagraph={saveParagraph}
										onDeleteParagraph={removeParagraph}
									/>
								))}
								{allBlocks.length === 0 && (
									<div className="text-gray-400 text-sm">Блоков пока нет.</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function PageMetaCard({
	page,
	onSave,
	onDelete,
}: {
	page: PageDto;
	onSave: (
		id: number,
		data: { slug?: string; title?: string; template?: PageTemplate; media?: MediaItem[] },
	) => void;
	onDelete: (id: number) => void;
}) {
	const [slug, setSlug] = useState(page.slug);
	const [title, setTitle] = useState(page.title);
	const [template, setTemplate] = useState<PageTemplate>(page.template);
	const [media, setMedia] = useState<MediaItem[]>(page.media ?? []);
	useEffect(() => {
		setSlug(page.slug);
		setTitle(page.title);
		setTemplate(page.template);
		setMedia(page.media ?? []);
	}, [page.slug, page.template, page.title]);

	return (
		<div className="border-2 border-blue-50 rounded-xl p-3">
			<h4 className="font-semibold text-blue-800 mb-2">Метаданные страницы</h4>
			<p className="text-xs text-gray-500 mb-2">
				Базовый шаблон задаёт вид контента, если у вкладки или блока не выбран свой.
			</p>
			<div className="grid grid-cols-2 gap-2">
				<label>
					<span className={adminLabelClass}>Slug</span>
					<input
						className={adminInputClass}
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
					/>
				</label>
				<label>
					<span className={adminLabelClass}>Заголовок</span>
					<input
						className={adminInputClass}
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
				</label>
				<label>
					<span className={adminLabelClass}>Базовый шаблон</span>
					<select
						className={adminInputClass}
						value={template}
						onChange={(e) => setTemplate(e.target.value as PageTemplate)}
					>
						{PAGE_TEMPLATES.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
				</label>
			</div>
			<div className="flex gap-2 mt-3">
				<AdminButton
					size="sm"
					variant="primary"
					onClick={() => onSave(page.id, { slug, title, template, media })}
				>
					Сохранить страницу
				</AdminButton>
				<AdminButton size="sm" variant="danger" onClick={() => onDelete(page.id)}>
					Удалить страницу
				</AdminButton>
			</div>

			<div className="mt-4">
				<div className="text-sm font-semibold text-blue-800 mb-2">Медиа-полоса</div>
				<MediaStripEditor value={media} onChange={setMedia} />
			</div>
		</div>
	);
}

function templateLabel(template: PageTemplate): string {
	return PAGE_TEMPLATES.find((item) => item.value === template)?.label ?? template;
}

function TabEditor({
	tab,
	maxPos,
	onSave,
	onDelete,
}: {
	tab: PageTab;
	maxPos: number;
	onSave: (data: {
		label?: string;
		position?: number;
		template?: ContentTemplate | null;
		media?: MediaItem[];
	}) => void;
	onDelete: () => void;
}) {
	const [label, setLabel] = useState(tab.label);
	const [position, setPosition] = useState(String(tab.position));
	const [template, setTemplate] = useState<string>(tab.template ?? '');
	const [media, setMedia] = useState<MediaItem[]>(tab.media ?? []);
	useEffect(() => {
		setLabel(tab.label);
		setPosition(String(tab.position));
		setTemplate(tab.template ?? '');
		setMedia(tab.media ?? []);
	}, [tab.label, tab.position, tab.template, tab.id]);

	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-[1fr_100px_auto_auto] gap-2 items-end">
				<label>
					<span className={adminLabelClass}>Название вкладки</span>
					<input
						className={adminInputClass}
						value={label}
						onChange={(e) => setLabel(e.target.value)}
					/>
				</label>
				<label>
					<span className={adminLabelClass}>Позиция</span>
					<input
						type="number"
						min={1}
						max={maxPos}
						className={adminInputClass}
						value={position}
						onChange={(e) => setPosition(e.target.value)}
					/>
				</label>
				<AdminButton
					size="sm"
					onClick={() =>
						onSave({
							label,
							position: Number(position),
							template: template === '' ? null : (template as ContentTemplate),
							media,
						})
					}
				>
					Сохранить
				</AdminButton>
				<AdminButton size="sm" variant="danger" onClick={onDelete}>
					Удалить
				</AdminButton>
			</div>
			<label className="block max-w-md">
				<span className={adminLabelClass}>Шаблон контента вкладки</span>
				<select
					className={adminInputClass}
					value={template}
					onChange={(e) => setTemplate(e.target.value)}
				>
					<option value="">Как у страницы (базовый)</option>
					{CONTENT_TEMPLATES.map((item) => (
						<option key={item.value} value={item.value}>
							{item.label}
						</option>
					))}
				</select>
			</label>

			<div className="mt-3">
				<div className="text-sm font-semibold text-blue-800 mb-2">Медиа-полоса вкладки</div>
				<MediaStripEditor value={media} onChange={setMedia} />
			</div>
		</div>
	);
}

function MediaStripEditor({
	value,
	onChange,
}: {
	value: MediaItem[];
	onChange: (next: MediaItem[]) => void;
}) {
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState<MediaItem[]>(value ?? []);

	useEffect(() => setItems(value ?? []), [value]);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

	return (
		<div className="rounded-2xl border-2 border-blue-50 bg-blue-50/30 p-3">
			<div className="flex items-center justify-between gap-2 mb-3">
				<div className="text-xs text-gray-500">
					Выбрано: <span className="font-semibold">{items.length}</span>
				</div>
				<div className="flex gap-2">
					<AdminButton size="sm" variant="secondary" onClick={() => setOpen(true)}>
						+ Добавить
					</AdminButton>
					<AdminButton
						size="sm"
						variant="primary"
						onClick={() => onChange(items)}
						disabled={items === value}
					>
						Применить
					</AdminButton>
				</div>
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={(evt) => {
					const activeId = String(evt.active.id);
					const overId = evt.over?.id ? String(evt.over.id) : '';
					if (!overId || activeId === overId) return;
					const oldIndex = items.findIndex((x) => mediaKey(x) === activeId);
					const newIndex = items.findIndex((x) => mediaKey(x) === overId);
					if (oldIndex < 0 || newIndex < 0) return;
					setItems(arrayMove(items, oldIndex, newIndex));
				}}
			>
				<SortableContext
					items={items.map(mediaKey)}
					strategy={horizontalListSortingStrategy}
				>
					<div className="flex gap-2 overflow-x-auto pb-1">
						{items.map((m) => (
							<SortableMediaChip
								key={mediaKey(m)}
								item={m}
								onRemove={() => setItems((prev) => prev.filter((x) => x !== m))}
							/>
						))}
						{items.length === 0 && (
							<div className="text-sm text-gray-400">Пока ничего не выбрано.</div>
						)}
					</div>
				</SortableContext>
			</DndContext>

			<MediaBrowserModal
				open={open}
				initialSelected={items}
				onClose={() => setOpen(false)}
				onConfirm={(picked) => {
					// добавляем новые, не теряя текущий порядок
					setItems((prev) => {
						const set = new Set(prev.map(mediaKey));
						const add = picked.filter((p) => !set.has(mediaKey(p)));
						return [...prev, ...add];
					});
				}}
			/>
		</div>
	);
}

function mediaKey(m: MediaItem): string {
	return `${m.kind}:${m.src}`;
}

function SortableMediaChip({
	item,
	onRemove,
}: {
	item: MediaItem;
	onRemove: () => void;
}) {
	const id = mediaKey(item);
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
	const style = { transform: CSS.Transform.toString(transform), transition };
	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center gap-2 rounded-2xl border-2 border-blue-100 bg-white px-3 py-2 shrink-0"
		>
			<button
				type="button"
				className="p-1 rounded-lg border border-blue-100 text-blue-500 hover:bg-blue-50 active:scale-95 transition-all touch-none"
				{...attributes}
				{...listeners}
				aria-label="Перетащить"
			>
				<GripVertical className="w-4 h-4" />
			</button>
			<div className="min-w-0">
				<div className="text-xs text-gray-400">{item.kind === 'photo' ? 'Фото' : 'Видео'}</div>
				<div className="text-sm font-semibold text-blue-800 truncate max-w-64">
					{item.title ?? item.src}
				</div>
			</div>
			<button
				type="button"
				onClick={onRemove}
				className="ml-1 p-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 active:scale-95 transition-all"
				aria-label="Удалить из подборки"
			>
				<X className="w-4 h-4" />
			</button>
		</div>
	);
}

function BlockEditor({
	block,
	parentLabel,
	maxPos,
	onSave,
	onDelete,
	onAddParagraph,
	onSaveParagraph,
	onDeleteParagraph,
}: {
	block: PageBlock;
	parentLabel: string;
	maxPos: number;
	onSave: (data: {
		img?: string | null;
		position?: number;
		template?: ContentTemplate | null;
	}) => void;
	onDelete: () => void;
	onAddParagraph: () => void;
	onSaveParagraph: (paragraphId: number, data: { text?: string; position?: number }) => void;
	onDeleteParagraph: (paragraphId: number) => void;
}) {
	const [img, setImg] = useState(block.img ?? '');
	const [position, setPosition] = useState(String(block.position));
	const [template, setTemplate] = useState<string>(block.template ?? '');
	useEffect(() => {
		setImg(block.img ?? '');
		setPosition(String(block.position));
		setTemplate(block.template ?? '');
	}, [block.img, block.position, block.template, block.id]);

	return (
		<div className="border border-blue-100 rounded-xl p-3">
			<div className="text-xs text-gray-400 mb-2">{parentLabel}</div>
			<div className="grid grid-cols-[1fr_100px_auto_auto_auto] gap-2 items-end">
				<div>
					<ImagePathInput
						label="Изображение"
						value={img}
						onChange={(next) => setImg(next)}
						placeholder="например: pages/block.jpg"
					/>
				</div>
				<label>
					<span className={adminLabelClass}>Позиция</span>
					<input
						type="number"
						min={1}
						max={maxPos}
						className={adminInputClass}
						value={position}
						onChange={(e) => setPosition(e.target.value)}
					/>
				</label>
				<AdminButton
					size="sm"
					onClick={() =>
						onSave({
							img,
							position: Number(position),
							template: template === '' ? null : (template as ContentTemplate),
						})
					}
				>
					Сохранить
				</AdminButton>
				<AdminButton size="sm" onClick={onAddParagraph}>
					+ Абзац
				</AdminButton>
				<AdminButton size="sm" variant="danger" onClick={onDelete}>
					Удалить
				</AdminButton>
			</div>

			<label className="block max-w-md mt-2">
				<span className={adminLabelClass}>Шаблон блока</span>
				<select
					className={adminInputClass}
					value={template}
					onChange={(e) => setTemplate(e.target.value)}
				>
					<option value="">Как у вкладки / страницы</option>
					{CONTENT_TEMPLATES.map((item) => (
						<option key={item.value} value={item.value}>
							{item.label}
						</option>
					))}
				</select>
			</label>

			<div className="mt-2 flex flex-col gap-2">
				{block.paragraphs.map((paragraph) => (
					<ParagraphEditor
						key={paragraph.id}
						id={paragraph.id}
						initialText={paragraph.text}
						initialPosition={paragraph.position}
						maxPos={block.paragraphs.length}
						onSave={onSaveParagraph}
						onDelete={onDeleteParagraph}
					/>
				))}
				{block.paragraphs.length === 0 && (
					<div className="text-gray-400 text-sm">У блока пока нет абзацев.</div>
				)}
			</div>
		</div>
	);
}

function ParagraphEditor({
	id,
	initialText,
	initialPosition,
	maxPos,
	onSave,
	onDelete,
}: {
	id: number;
	initialText: string;
	initialPosition: number;
	maxPos: number;
	onSave: (id: number, data: { text?: string; position?: number }) => void;
	onDelete: (id: number) => void;
}) {
	const [text, setText] = useState(initialText);
	const [position, setPosition] = useState(String(initialPosition));
	useEffect(() => {
		setText(initialText);
		setPosition(String(initialPosition));
	}, [initialPosition, initialText]);

	return (
		<div className="border border-gray-100 rounded-xl p-2">
			<div className="grid grid-cols-[1fr_100px_auto_auto] gap-2 items-end">
				<label>
					<span className={adminLabelClass}>Текст абзаца</span>
					<textarea
						className={`${adminInputClass} resize-y min-h-16`}
						value={text}
						onChange={(e) => setText(e.target.value)}
					/>
				</label>
				<label>
					<span className={adminLabelClass}>Позиция</span>
					<input
						type="number"
						min={1}
						max={maxPos}
						className={adminInputClass}
						value={position}
						onChange={(e) => setPosition(e.target.value)}
					/>
				</label>
				<AdminButton
					size="sm"
					onClick={() => onSave(id, { text, position: Number(position) })}
				>
					Сохранить
				</AdminButton>
				<AdminButton size="sm" variant="danger" onClick={() => onDelete(id)}>
					Удалить
				</AdminButton>
			</div>
		</div>
	);
}

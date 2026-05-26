import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	autosaveDraft,
	createPage,
	deletePage,
	fetchPageById,
	fetchPages,
	publishPage,
	fetchPageVersions,
	updatePageMeta,
	type DraftPage,
	type PageSummary,
	type PageVersionSummary,
} from '../../../../api/pages';
import { EMPTY_DOCUMENT, type PageDocument } from '@museum/document';
import { ApiError } from '../../../../shared/api/client';
import AdminButton from '../ui/AdminButton';
import AdminCreateForm from '../ui/AdminCreateForm';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';
import { useAdminToast } from '../ui/AdminToastContext';
import { ErrorBox } from '../ui/ErrorBox';
import DocumentEditor from './document-editor/DocumentEditor';
import PageVersionsPanel from './PageVersionsPanel';
import SlugPathSelect from './SlugPathSelect';

const THEME_OPTIONS = [
	{ value: 'default', label: 'По умолчанию' },
	{ value: 'history', label: 'История' },
	{ value: 'sport', label: 'Спорт' },
];

function errorMessage(error: unknown, fallback: string): string {
	return error instanceof ApiError ? error.message : fallback;
}

function serializeDocument(doc: PageDocument): string {
	return JSON.stringify(doc);
}

export default function PagesPanel() {
	const toast = useAdminToast();
	const [pages, setPages] = useState<PageSummary[]>([]);
	const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
	const [draft, setDraft] = useState<DraftPage | null>(null);
	const [document, setDocument] = useState<PageDocument>(EMPTY_DOCUMENT);
	const [versions, setVersions] = useState<PageVersionSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [creating, setCreating] = useState(false);
	const [newPageSlug, setNewPageSlug] = useState('');
	const [newPageTitle, setNewPageTitle] = useState('');
	const savedSnapshotRef = useRef(serializeDocument(EMPTY_DOCUMENT));

	const isDirty = useMemo(
		() => serializeDocument(document) !== savedSnapshotRef.current,
		[document],
	);

	const markSaved = useCallback((doc: PageDocument) => {
		savedSnapshotRef.current = serializeDocument(doc);
	}, []);

	const loadPages = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const list = await fetchPages();
			setPages(list);
			if (list.length === 0) {
				setSelectedPageId(null);
				setDraft(null);
				return;
			}
			const nextId =
				selectedPageId && list.some((p) => p.id === selectedPageId)
					? selectedPageId
					: list[0].id;
			setSelectedPageId(nextId);
		} catch (err) {
			const msg = errorMessage(err, 'Не удалось загрузить список страниц');
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	}, [selectedPageId, toast]);

	const loadDraft = useCallback(
		async (pageId: number) => {
			try {
				setError(null);
				const data = await fetchPageById(pageId);
				const doc = data.draftDocument ?? EMPTY_DOCUMENT;
				setDraft(data);
				setDocument(doc);
				markSaved(doc);
				const v = await fetchPageVersions(data.slug);
				setVersions(v);
			} catch (err) {
				const msg = errorMessage(err, 'Не удалось загрузить черновик');
				setError(msg);
				toast.error(msg);
				setDraft(null);
			}
		},
		[toast, markSaved],
	);

	const persistDraft = useCallback(async () => {
		if (!draft) return false;
		setSaving(true);
		try {
			const result = await autosaveDraft(draft.slug, document, draft.documentVersion);
			const refreshed = await fetchPageById(draft.id);
			const doc = refreshed.draftDocument ?? EMPTY_DOCUMENT;
			setDraft(refreshed);
			setDocument(doc);
			markSaved(doc);
			toast.success(`Черновик сохранён (версия ${result.documentVersion})`);
			return true;
		} catch (err) {
			toast.error(errorMessage(err, 'Ошибка сохранения'));
			return false;
		} finally {
			setSaving(false);
		}
	}, [draft, document, toast, markSaved]);

	useEffect(() => {
		void loadPages();
	}, [loadPages]);

	useEffect(() => {
		if (selectedPageId) void loadDraft(selectedPageId);
	}, [selectedPageId, loadDraft]);

	const handleDocumentChange = (next: PageDocument) => {
		setDocument(next);
	};

	const handleDiscardChanges = () => {
		if (!draft || !isDirty) return;
		if (!confirm('Отменить все несохранённые правки и вернуть последний сохранённый черновик?')) {
			return;
		}
		const doc = draft.draftDocument ?? EMPTY_DOCUMENT;
		setDocument(doc);
		markSaved(doc);
		toast.success('Изменения отменены');
	};

	const handlePublish = async () => {
		if (!draft) return;
		if (isDirty) {
			const saveFirst = confirm(
				'Есть несохранённые изменения. Сохранить черновик перед публикацией?',
			);
			if (saveFirst) {
				const ok = await persistDraft();
				if (!ok) return;
			} else if (
				!confirm('Опубликовать без сохранения текущих правок в черновике? На киоск уйдёт последний сохранённый черновик.')
			) {
				return;
			}
		}
		setSaving(true);
		try {
			await publishPage(draft.slug);
			await loadDraft(draft.id);
			toast.success('Страница опубликована');
		} catch (err) {
			toast.error(errorMessage(err, 'Ошибка публикации'));
		} finally {
			setSaving(false);
		}
	};

	const handleRestoredFromVersion = (refreshed: DraftPage) => {
		const doc = refreshed.draftDocument ?? EMPTY_DOCUMENT;
		setDraft(refreshed);
		setDocument(doc);
		markSaved(doc);
		void fetchPageVersions(refreshed.slug).then(setVersions);
	};

	const handleRevertToPublished = () => {
		if (!draft?.publishedDocument) return;
		setDocument(draft.publishedDocument);
	};

	const handleCreate = async () => {
		const slug = newPageSlug.trim();
		const title = newPageTitle.trim();
		if (!slug) {
			toast.error('Укажите путь страницы');
			return;
		}
		if (!title) {
			toast.error('Укажите заголовок');
			return;
		}
		setCreating(true);
		try {
			const created = await createPage({ slug, title });
			setNewPageSlug('');
			setNewPageTitle('');
			await loadPages();
			setSelectedPageId(created.id);
			toast.success('Страница создана');
		} catch (err) {
			toast.error(errorMessage(err, 'Не удалось создать страницу'));
		} finally {
			setCreating(false);
		}
	};

	if (loading && pages.length === 0) {
		return <p className="text-stone-500">Загрузка...</p>;
	}

	return (
		<div className="flex flex-col gap-6">
			{error && <ErrorBox msg={error} />}

			<AdminCreateForm
				onSubmit={handleCreate}
				disabled={creating}
				submitLabel="Создать страницу"
			>
				<SlugPathSelect value={newPageSlug} onChange={setNewPageSlug} mode="create" />
				<div>
					<label className={adminLabelClass}>Заголовок</label>
					<input
						className={adminInputClass}
						value={newPageTitle}
						onChange={(e) => setNewPageTitle(e.target.value)}
						placeholder="Название страницы"
					/>
				</div>
			</AdminCreateForm>

			<div className="flex gap-6 flex-col lg:flex-row">
				<ul className="lg:w-56 shrink-0 space-y-1">
					{pages.map((p) => (
						<li key={p.id}>
							<button
								type="button"
								className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
									p.id === selectedPageId
										? 'bg-blue-100 text-blue-900'
										: 'hover:bg-stone-100'
								}`}
								onClick={() => setSelectedPageId(p.id)}
							>
								{p.title}
								<span className="block text-xs text-stone-500">{p.slug}</span>
							</button>
						</li>
					))}
				</ul>

				{draft && (
					<div className="flex-1 min-w-0 space-y-4">
						<div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 flex flex-wrap gap-3 items-center">
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-medium text-stone-800">
									Черновик · v{draft.documentVersion}
								</span>
								<span className="text-xs text-stone-500">
									{draft.publishedDocument
										? 'На киоске опубликована версия'
										: 'На киоске ещё ничего не опубликовано'}
									{isDirty && ' · есть несохранённые правки'}
								</span>
							</div>
							<div className="flex-1" />
							<AdminButton
								type="button"
								onClick={() => void persistDraft()}
								disabled={saving || !isDirty}
							>
								Сохранить черновик
							</AdminButton>
							<AdminButton
								type="button"
								variant="secondary"
								onClick={handleDiscardChanges}
								disabled={saving || !isDirty}
							>
								Отменить правки
							</AdminButton>
							<AdminButton type="button" onClick={() => void handlePublish()} disabled={saving}>
								Опубликовать
							</AdminButton>
							<AdminButton
								type="button"
								variant="danger"
								onClick={() => {
									if (!confirm('Удалить страницу?')) return;
									void deletePage(draft.id).then(() => loadPages());
								}}
							>
								Удалить
							</AdminButton>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<label className={adminLabelClass}>Заголовок</label>
								<input
									className={adminInputClass}
									defaultValue={draft.title}
									onBlur={(e) => {
										void updatePageMeta(draft.id, { title: e.target.value }).then(
											loadPages,
										);
									}}
								/>
							</div>
							<div>
								<label className={adminLabelClass}>Тема оформления</label>
								<select
									className={adminInputClass}
									defaultValue={draft.themeKey}
									onChange={(e) => {
										void updatePageMeta(draft.id, {
											themeKey: e.target.value,
										}).then(() => loadDraft(draft.id));
									}}
								>
									{THEME_OPTIONS.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</select>
							</div>
						</div>

						<div>
							<label className={adminLabelClass}>Путь (slug)</label>
							<SlugPathSelect
								value={draft.slug}
								onChange={(slug) => {
									void updatePageMeta(draft.id, { slug }).then(() => {
										void loadPages();
										void loadDraft(draft.id);
									});
								}}
								mode="edit"
								currentSlug={draft.slug}
							/>
						</div>

						<PageVersionsPanel
							draft={draft}
							versions={versions}
							saving={saving}
							onRestored={handleRestoredFromVersion}
							onRevertToPublished={handleRevertToPublished}
						/>

						<DocumentEditor
							document={document}
							pageTitle={draft.title}
							onChange={handleDocumentChange}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

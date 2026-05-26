import { useCallback, useEffect, useState } from 'react';
import {
	createCategory,
	createRole,
	createTag,
	deleteCategory,
	deleteRole,
	deleteTag,
	fetchTaxonomy,
	updateCategory,
	updateRole,
	updateTag,
	type TaxonomyBundle,
	type TaxonomyItem,
} from '../../../../api/people';
import AdminButton from '../ui/AdminButton';
import AdminCreateForm from '../ui/AdminCreateForm';
import { useAdminToast } from '../ui/AdminToastContext';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';
import { ErrorBox } from '../ui/ErrorBox';
import { ConfirmDelete } from '../ui/ConfirmDelete';

type TabId = 'roles' | 'tags' | 'categories';

const TABS: { id: TabId; label: string }[] = [
	{ id: 'roles', label: 'Роли' },
	{ id: 'tags', label: 'Теги' },
	{ id: 'categories', label: 'Категории' },
];

function slugify(label: string): string {
	return label
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9а-яё-]/gi, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

type RowProps = {
	item: TaxonomyItem;
	onSave: (id: number, data: { slug?: string; label?: string; sortOrder?: number }) => Promise<void>;
	onDelete: (id: number) => Promise<void>;
	showSortOrder?: boolean;
};

function TaxonomyRow({ item, onSave, onDelete, showSortOrder }: RowProps) {
	const [editing, setEditing] = useState(false);
	const [slug, setSlug] = useState(item.slug);
	const [label, setLabel] = useState(item.label);
	const [sortOrder, setSortOrder] = useState(String(item.sortOrder ?? 0));
	const [busy, setBusy] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	useEffect(() => {
		setSlug(item.slug);
		setLabel(item.label);
		setSortOrder(String(item.sortOrder ?? 0));
		setEditing(false);
		setConfirmDelete(false);
	}, [item.id, item.slug, item.label, item.sortOrder]);

	if (editing) {
		return (
			<tr className="bg-blue-50/80">
				<td colSpan={showSortOrder ? 4 : 3} className="p-3">
					<div className="flex flex-wrap gap-2 items-end">
						<label className="flex flex-col gap-1 min-w-[140px]">
							<span className={adminLabelClass}>Slug</span>
							<input className={adminInputClass} value={slug} onChange={(e) => setSlug(e.target.value)} />
						</label>
						<label className="flex flex-col gap-1 flex-1 min-w-[160px]">
							<span className={adminLabelClass}>Название</span>
							<input
								className={adminInputClass}
								value={label}
								onChange={(e) => setLabel(e.target.value)}
							/>
						</label>
						{showSortOrder && (
							<label className="flex flex-col gap-1 w-24">
								<span className={adminLabelClass}>Порядок</span>
								<input
									className={adminInputClass}
									type="number"
									value={sortOrder}
									onChange={(e) => setSortOrder(e.target.value)}
								/>
							</label>
						)}
						<AdminButton
							variant="primary"
							size="sm"
							disabled={busy}
							onClick={() => {
								setBusy(true);
								void onSave(item.id, {
									slug: slug.trim(),
									label: label.trim(),
									sortOrder: showSortOrder ? Number(sortOrder) : undefined,
								}).finally(() => {
									setBusy(false);
									setEditing(false);
								});
							}}
						>
							Сохранить
						</AdminButton>
						<AdminButton variant="secondary" size="sm" onClick={() => setEditing(false)}>
							Отмена
						</AdminButton>
					</div>
				</td>
			</tr>
		);
	}

	return (
		<tr className="border-t border-blue-50 hover:bg-blue-50/40">
			<td className="px-4 py-3 text-sm font-mono text-gray-500">{item.slug}</td>
			<td className="px-4 py-3 text-sm font-semibold text-blue-900">{item.label}</td>
			{showSortOrder && (
				<td className="px-4 py-3 text-sm text-gray-500">{item.sortOrder ?? 0}</td>
			)}
			<td className="px-4 py-3">
				<div className="flex gap-2 justify-end">
					<AdminButton variant="secondary" size="sm" onClick={() => setEditing(true)}>
						Изменить
					</AdminButton>
					{!confirmDelete ? (
						<AdminButton
							variant="danger"
							size="sm"
							className="bg-transparent !text-red-600 !border-red-200 hover:!bg-red-50 text-xs shadow-none"
							onClick={() => setConfirmDelete(true)}
						>
							Удалить
						</AdminButton>
					) : (
						<ConfirmDelete
							onYes={() => {
								setBusy(true);
								void onDelete(item.id).finally(() => setBusy(false));
							}}
							onNo={() => setConfirmDelete(false)}
							busy={busy}
						/>
					)}
				</div>
			</td>
		</tr>
	);
}

export default function TaxonomyPanel() {
	const toast = useAdminToast();
	const [tab, setTab] = useState<TabId>('roles');
	const [taxonomy, setTaxonomy] = useState<TaxonomyBundle>({ roles: [], tags: [], categories: [] });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [newSlug, setNewSlug] = useState('');
	const [newLabel, setNewLabel] = useState('');
	const [newSort, setNewSort] = useState('0');
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			setTaxonomy(await fetchTaxonomy());
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Ошибка загрузки');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const items = tab === 'roles' ? taxonomy.roles : tab === 'tags' ? taxonomy.tags : taxonomy.categories;

	const handleCreate = async () => {
		const slug = (newSlug.trim() || slugify(newLabel)).trim();
		const label = newLabel.trim() || slug;
		if (!slug) {
			toast.error('Укажите slug или название');
			return;
		}
		setBusy(true);
		try {
			if (tab === 'roles') {
				await createRole({ slug, label, sortOrder: Number(newSort) || 0 });
			} else if (tab === 'tags') {
				await createTag({ slug, label });
			} else {
				await createCategory({ slug, label });
			}
			setNewSlug('');
			setNewLabel('');
			setNewSort('0');
			toast.success('Создано');
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Ошибка');
		} finally {
			setBusy(false);
		}
	};

	const handleSaveRole = async (
		id: number,
		data: { slug?: string; label?: string; sortOrder?: number },
	) => {
		await updateRole(id, data);
		toast.success('Сохранено');
		await load();
	};

	const handleSaveTag = async (id: number, data: { slug?: string; label?: string }) => {
		await updateTag(id, data);
		toast.success('Сохранено');
		await load();
	};

	const handleSaveCategory = async (id: number, data: { slug?: string; label?: string }) => {
		await updateCategory(id, data);
		toast.success('Сохранено');
		await load();
	};

	const handleDelete = async (id: number) => {
		try {
			if (tab === 'roles') await deleteRole(id);
			else if (tab === 'tags') await deleteTag(id);
			else await deleteCategory(id);
			toast.success('Удалено');
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Не удалось удалить');
		}
	};

	return (
		<div className="flex flex-col gap-5 max-w-3xl">
			<p className="text-sm text-gray-500">
				Роли, теги и категории привязываются к людям во вкладке «Люди». Slug используется в API и
				фильтрах.
			</p>

			<div className="flex gap-2 flex-wrap">
				{TABS.map((t) => (
					<button
						key={t.id}
						type="button"
						onClick={() => setTab(t.id)}
						className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
							tab === t.id
								? 'bg-blue-700 text-white border-blue-700'
								: 'border-blue-200 text-blue-800 hover:bg-blue-50'
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			<div className="bg-white rounded-2xl border-2 border-blue-100 p-4 shadow-sm">
				<p className="text-blue-700 font-bold text-sm mb-3">
					Новая {tab === 'roles' ? 'роль' : tab === 'tags' ? 'тег' : 'категория'}
				</p>
				<AdminCreateForm onSubmit={handleCreate} disabled={busy} submitLabel="Добавить">
					<label className="flex flex-col gap-1 min-w-[140px]">
						<span className={adminLabelClass}>Название</span>
						<input
							className={adminInputClass}
							value={newLabel}
							onChange={(e) => {
								setNewLabel(e.target.value);
								if (!newSlug) setNewSlug(slugify(e.target.value));
							}}
							placeholder="Ректор ГрГУ"
						/>
					</label>
					<label className="flex flex-col gap-1 min-w-[140px]">
						<span className={adminLabelClass}>Slug</span>
						<input
							className={adminInputClass}
							value={newSlug}
							onChange={(e) => setNewSlug(e.target.value)}
							placeholder="rector"
						/>
					</label>
					{tab === 'roles' && (
						<label className="flex flex-col gap-1 w-24">
							<span className={adminLabelClass}>Порядок</span>
							<input
								className={adminInputClass}
								type="number"
								value={newSort}
								onChange={(e) => setNewSort(e.target.value)}
							/>
						</label>
					)}
				</AdminCreateForm>
			</div>

			{error && <ErrorBox msg={error} />}

			<div className="bg-white rounded-2xl border-2 border-blue-100 overflow-hidden shadow-sm">
				<table className="w-full">
					<thead className="bg-blue-50 text-left">
						<tr>
							<th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase">Slug</th>
							<th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase">Название</th>
							{tab === 'roles' && (
								<th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase w-20">
									Порядок
								</th>
							)}
							<th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase w-40 text-right">
								Действия
							</th>
						</tr>
					</thead>
					<tbody>
						{loading && (
							<tr>
								<td colSpan={tab === 'roles' ? 4 : 3} className="px-4 py-8 text-center text-blue-500">
									Загрузка…
								</td>
							</tr>
						)}
						{!loading &&
							items.map((item) => (
								<TaxonomyRow
									key={item.id}
									item={item}
									showSortOrder={tab === 'roles'}
									onSave={
										tab === 'roles'
											? handleSaveRole
											: tab === 'tags'
												? handleSaveTag
												: handleSaveCategory
									}
									onDelete={handleDelete}
								/>
							))}
						{!loading && items.length === 0 && (
							<tr>
								<td colSpan={tab === 'roles' ? 4 : 3} className="px-4 py-8 text-center text-gray-400">
									Список пуст
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<div className="text-xs text-gray-400 rounded-xl bg-blue-50 border border-blue-100 p-3">
				<p className="font-semibold text-blue-800 mb-1">Подсказка для миграции со старых вкладок</p>
				<p>
					Создайте роли со slug: <code className="text-blue-700">rector</code>,{' '}
					<code className="text-blue-700">teacher-vov</code>,{' '}
					<code className="text-blue-700">teacher-afgan</code>,{' '}
					<code className="text-blue-700">olympic-coach</code>,{' '}
					<code className="text-blue-700">olympic-student</code>,{' '}
					<code className="text-blue-700">trainer</code> — так публичные страницы продолжат
					показывать тех же людей.
				</p>
			</div>
		</div>
	);
}

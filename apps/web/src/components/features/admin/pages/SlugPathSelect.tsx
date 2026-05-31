import { useEffect, useMemo, useState } from 'react';
import { fetchAllMenuItems, type MenuItem } from '../../../../api/menu';
import { fetchPages } from '../../../../api/pages';
import { normalizeSlugPath } from '../../../../lib/document-tree';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';

const CUSTOM = '__custom__';

type MenuPathOption = {
	path: string;
	label: string;
};

type Props = {
	value: string;
	onChange: (slug: string) => void;
	onMenuPathSelect?: (meta: { slug: string; label: string }) => void;
	/** При создании — скрыть пути, для которых страница уже есть */
	mode?: 'create' | 'edit';
	currentSlug?: string;
};

function isSectionPath(path: string, menu: MenuItem[]): boolean {
	const p = normalizeSlugPath(path);
	return menu.some(
		(m) =>
			m.is_active &&
			normalizeSlugPath(m.section) === p &&
			normalizeSlugPath(m.path) !== p,
	);
}

function buildPageOptions(menu: MenuItem[], pageSlugSet: Set<string>, mode: 'create' | 'edit'): MenuPathOption[] {
	const seen = new Set<string>();
	const options: MenuPathOption[] = [];

	for (const item of menu) {
		if (!item.is_active || !item.path.trim()) continue;
		const path = normalizeSlugPath(item.path);
		if (!path || seen.has(path)) continue;
		if (isSectionPath(path, menu)) continue;
		if (mode === 'create' && pageSlugSet.has(path)) continue;
		seen.add(path);
		options.push({ path, label: item.label.trim() || path });
	}

	return options.sort((a, b) => a.path.localeCompare(b.path));
}

export default function SlugPathSelect({
	value,
	onChange,
	onMenuPathSelect,
	mode = 'create',
	currentSlug,
}: Props) {
	const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
	const [pageSlugs, setPageSlugs] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		Promise.all([fetchAllMenuItems(), fetchPages()])
			.then(([menu, pages]) => {
				if (cancelled) return;
				setMenuItems(menu);
				setPageSlugs(pages.map((p) => p.slug));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const pageSlugSet = useMemo(() => new Set(pageSlugs), [pageSlugs]);

	const pageOptions = useMemo(
		() => buildPageOptions(menuItems, pageSlugSet, mode),
		[menuItems, pageSlugSet, mode],
	);

	const pagePathSet = useMemo(() => new Set(pageOptions.map((o) => o.path)), [pageOptions]);

	const allMenuPaths = useMemo(() => {
		const paths = menuItems
			.filter((m) => m.is_active && m.path.trim())
			.map((m) => normalizeSlugPath(m.path));
		return [...new Set(paths)].sort((a, b) => a.localeCompare(b));
	}, [menuItems]);

	const selectValue = useMemo(() => {
		const normalized = normalizeSlugPath(value);
		if (!normalized) return CUSTOM;
		if (pagePathSet.has(normalized)) return normalized;
		if (mode === 'edit' && allMenuPaths.includes(normalized)) return normalized;
		if (pageSlugs.includes(normalized) && normalized === currentSlug) return normalized;
		return CUSTOM;
	}, [value, pagePathSet, allMenuPaths, mode, pageSlugs, currentSlug]);

	const showCustomInput = selectValue === CUSTOM;

	const handleSelectChange = (v: string) => {
		if (v === CUSTOM) {
			onChange(value || '');
			return;
		}
		onChange(v);
		const option = pageOptions.find((o) => o.path === v);
		if (option && onMenuPathSelect) {
			onMenuPathSelect({ slug: option.path, label: option.label });
		}
	};

	return (
		<div className="flex flex-col gap-1 min-w-[200px]">
			<label className={adminLabelClass}>Путь страницы (slug)</label>
			<select
				className={adminInputClass}
				disabled={loading}
				value={selectValue}
				onChange={(e) => handleSelectChange(e.target.value)}
			>
				<option value="">{loading ? 'Загрузка…' : '— выберите путь —'}</option>
				{pageOptions.length > 0 && (
					<optgroup label="Страницы">
						{pageOptions.map((o) => (
							<option key={o.path} value={o.path}>
								{o.label} ({o.path})
							</option>
						))}
					</optgroup>
				)}
				{mode === 'edit' && pageSlugs.length > 0 && (
					<optgroup label="Существующие страницы">
						{pageSlugs.map((p) => (
							<option key={p} value={p}>
								{p}
							</option>
						))}
					</optgroup>
				)}
				<option value={CUSTOM}>Свой путь…</option>
			</select>
			{showCustomInput && (
				<input
					className={adminInputClass}
					value={value}
					onChange={(e) => onChange(normalizeSlugPath(e.target.value))}
					placeholder="history/memory"
				/>
			)}
			<p className="text-xs text-stone-500">
				Как в адресе киоска, например history/memory
			</p>
		</div>
	);
}

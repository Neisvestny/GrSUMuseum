import { useEffect, useMemo, useState } from 'react';
import { fetchAllMenuItems } from '../../../../api/menu';
import { fetchPages } from '../../../../api/pages';
import { normalizeSlugPath } from '../../../../lib/document-tree';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';

const CUSTOM = '__custom__';

type Props = {
	value: string;
	onChange: (slug: string) => void;
	/** При создании — скрыть пути, для которых страница уже есть */
	mode?: 'create' | 'edit';
	currentSlug?: string;
};

export default function SlugPathSelect({ value, onChange, mode = 'create', currentSlug }: Props) {
	const [menuPaths, setMenuPaths] = useState<string[]>([]);
	const [pageSlugs, setPageSlugs] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		Promise.all([fetchAllMenuItems(), fetchPages()])
			.then(([menu, pages]) => {
				if (cancelled) return;
				const paths = menu
					.filter((m) => m.is_active && m.path.trim())
					.map((m) => normalizeSlugPath(m.path));
				setMenuPaths([...new Set(paths)].sort((a, b) => a.localeCompare(b)));
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

	const availableMenuPaths = useMemo(() => {
		if (mode !== 'create') return menuPaths;
		return menuPaths.filter((p) => !pageSlugSet.has(p));
	}, [menuPaths, mode, pageSlugSet]);

	const selectValue = useMemo(() => {
		const normalized = normalizeSlugPath(value);
		if (!normalized) return CUSTOM;
		if (availableMenuPaths.includes(normalized)) return normalized;
		if (mode === 'edit' && menuPaths.includes(normalized)) return normalized;
		if (pageSlugs.includes(normalized) && normalized === currentSlug) return normalized;
		return CUSTOM;
	}, [value, availableMenuPaths, menuPaths, mode, pageSlugs, currentSlug]);

	const showCustomInput = selectValue === CUSTOM;

	return (
		<div className="flex flex-col gap-1 min-w-[200px]">
			<label className={adminLabelClass}>Путь страницы (slug)</label>
			<select
				className={adminInputClass}
				disabled={loading}
				value={selectValue}
				onChange={(e) => {
					const v = e.target.value;
					if (v === CUSTOM) {
						onChange(value || '');
					} else {
						onChange(v);
					}
				}}
			>
				<option value="">{loading ? 'Загрузка…' : '— выберите путь —'}</option>
				{availableMenuPaths.length > 0 && (
					<optgroup label="Пути из меню">
						{availableMenuPaths.map((p) => (
							<option key={p} value={p}>
								{p}
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

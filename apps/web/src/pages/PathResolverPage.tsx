import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { LoadingState } from '../components/design-system/States';
import SectionMenuPage from '../components/patterns/SectionMenuPage';
import CmsDynamicPage from './CmsDynamicPage';
import { useMenuSection } from '../hooks/cms/useMenuSection';

function pathFromLocation(pathname: string): string {
	return pathname
		.trim()
		.replace(/^\/+|\/+$/g, '')
		.replace(/\/{2,}/g, '/');
}

function sectionTitle(section: string): string {
	if (!section) return 'Раздел';
	const last = section.includes('/') ? (section.split('/').pop() ?? section) : section;
	return last.charAt(0).toUpperCase() + last.slice(1);
}

/**
 * Любой путь (включая вложенный вроде home/gallery): сначала проверяем меню секции
 * с таким ключом, иначе отдаём динамическую CMS-страницу.
 */
export default function PathResolverPage() {
	const location = useLocation();
	const sectionKey = useMemo(() => pathFromLocation(location.pathname), [location.pathname]);
	const { items, loading, error } = useMenuSection(sectionKey);

	const mapped = useMemo(
		() => items.map((item) => ({ label: item.label, path: item.path })),
		[items],
	);

	if (!sectionKey) {
		return <CmsDynamicPage />;
	}

	if (loading) return <LoadingState />;
	// Ошибка API меню не блокируем: показываем CMS по этому пути (если есть)
	if (error) return <CmsDynamicPage />;

	if (items.length > 0) {
		return <SectionMenuPage title={sectionTitle(sectionKey)} items={mapped} />;
	}

	return <CmsDynamicPage />;
}

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import CmsPageContent from '../components/patterns/CmsPageContent';
import { usePageBySlug } from '../hooks/cms/usePageBySlug';
import MainLayout from '../layouts/MainLayout';

function slugFromPath(pathname: string): string {
	const normalized = pathname.replace(/\/+$/, '');
	const parts = normalized.split('/').filter(Boolean);
	if (parts.length === 0) return '';
	return parts[parts.length - 1];
}

export default function CmsDynamicPage() {
	const location = useLocation();
	const slug = useMemo(() => slugFromPath(location.pathname), [location.pathname]);
	const { page, loading, error } = usePageBySlug(slug);

	const title = page?.title || 'Страница';

	return (
		<MainLayout title={title}>
			<CmsPageContent
				page={page}
				loading={loading}
				error={error}
				emptyText="Для этого пути страница пока не настроена в CMS"
			/>
		</MainLayout>
	);
}

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import CmsPageContent from '../components/patterns/CmsPageContent';
import { usePageByPath } from '../hooks/cms/usePageBySlug';
import MainLayout from '../layouts/MainLayout';

function pathFromLocation(pathname: string): string {
	return pathname
		.trim()
		.replace(/^\/+|\/+$/g, '')
		.replace(/\/{2,}/g, '/');
}

export default function CmsDynamicPage() {
	const location = useLocation();
	const path = useMemo(() => pathFromLocation(location.pathname), [location.pathname]);
	const { page, loading, error } = usePageByPath(path);

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

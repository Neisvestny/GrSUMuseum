import CmsPageContent from '../../components/patterns/CmsPageContent';
import { usePageBySlug } from '../../hooks/cms/usePageBySlug';
import MainLayout from '../../layouts/MainLayout';

export default function HistoryDevelopment() {
	const { page, loading, error } = usePageBySlug('history-development');

	return (
		<MainLayout title="История развития ГрГУ">
			<CmsPageContent
				page={page}
				loading={loading}
				error={error}
				emptyText="Контент для этой страницы пока не добавлен"
			/>
		</MainLayout>
	);
}

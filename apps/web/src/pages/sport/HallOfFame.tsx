import CmsPageContent from '../../components/patterns/CmsPageContent';
import { usePageBySlug } from '../../hooks/cms/usePageBySlug';
import MainLayout from '../../layouts/MainLayout';

export default function HallOfFame() {
	const { page, loading, error } = usePageBySlug('hall-of-fame');

	return (
		<MainLayout title="Зал славы">
			<CmsPageContent
				page={page}
				loading={loading}
				error={error}
				emptyText="Контент для раздела «Зал славы» пока не добавлен"
			/>
		</MainLayout>
	);
}

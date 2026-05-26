import CmsPageContent from '../../components/patterns/CmsPageContent';
import { usePageBySlug } from '../../hooks/cms/usePageBySlug';
import MainLayout from '../../layouts/MainLayout';

export default function Trainers() {
	const { page, loading, error } = usePageBySlug('trainers');

	return (
		<MainLayout title="Тренеры">
			<CmsPageContent
				page={page}
				loading={loading}
				error={error}
				emptyText="Контент для раздела «Тренеры» пока не добавлен"
			/>
		</MainLayout>
	);
}

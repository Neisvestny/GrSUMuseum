import CmsPageContent from '../../components/patterns/CmsPageContent';
import { usePageBySlug } from '../../hooks/cms/usePageBySlug';
import MainLayout from '../../layouts/MainLayout';

export default function StudentsWorkTeams() {
	const { page, loading, error } = usePageBySlug('students-work-teams');

	return (
		<MainLayout title="Студенческие отряды">
			<CmsPageContent
				page={page}
				loading={loading}
				error={error}
				emptyText="Контент для студенческих отрядов пока не добавлен"
			/>
		</MainLayout>
	);
}

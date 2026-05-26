import CmsPageContent from '../../components/patterns/CmsPageContent';
import { usePageBySlug } from '../../hooks/cms/usePageBySlug';
import MainLayout from '../../layouts/MainLayout';

export default function StudentInitiatives() {
	const { page, loading, error } = usePageBySlug('student-initiatives');

	return (
		<MainLayout title="Студенческие инициативы, проекты, конкурсы">
			<CmsPageContent page={page} loading={loading} error={error} />
		</MainLayout>
	);
}

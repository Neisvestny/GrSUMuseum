import CmsPageContent from '../../components/patterns/CmsPageContent';
import { usePageBySlug } from '../../hooks/cms/usePageBySlug';
import MainLayout from '../../layouts/MainLayout';

export default function StudentSport() {
	const { page, loading, error } = usePageBySlug('student-sport');

	return (
		<MainLayout title="Студенческий спорт">
			<CmsPageContent page={page} loading={loading} error={error} />
		</MainLayout>
	);
}

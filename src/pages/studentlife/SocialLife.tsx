import CmsPageContent from '../../components/patterns/CmsPageContent';
import { usePageBySlug } from '../../hooks/cms/usePageBySlug';
import MainLayout from '../../layouts/MainLayout';

export default function SocialLife() {
	const { page, loading, error } = usePageBySlug('social-life');

	return (
		<MainLayout title="Общественная жизнь">
			<CmsPageContent page={page} loading={loading} error={error} />
		</MainLayout>
	);
}

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/design-system/States';
import SectionMenuPage from '../components/patterns/SectionMenuPage';
import { useMenuSection } from '../hooks/cms/useMenuSection';

function sectionTitle(section: string): string {
	if (!section) return 'Раздел';
	return section.charAt(0).toUpperCase() + section.slice(1);
}

export default function DynamicSectionMenuPage() {
	const { section = '' } = useParams();
	const { items, loading, error } = useMenuSection(section);

	const mapped = useMemo(
		() => items.map((item) => ({ label: item.label, path: item.path })),
		[items],
	);

	if (loading) return <LoadingState />;
	if (error) return <ErrorState text={error} />;

	return <SectionMenuPage title={sectionTitle(section)} items={mapped} />;
}

import SectionMenuPage from '../../components/patterns/SectionMenuPage';
import { useMenuSection } from '../../hooks/cms/useMenuSection';

export default function Memory() {
	const { items } = useMenuSection('memory');
	return (
		<SectionMenuPage
			title="Купаловцы помнят"
			items={items.map((item) => ({ label: item.label, path: item.path }))}
		/>
	);
}

import SectionMenuPage from '../../components/patterns/SectionMenuPage';
import { useMenuSection } from '../../hooks/cms/useMenuSection';

export default function Sport() {
	const { items } = useMenuSection('sport');
	return (
		<SectionMenuPage
			title="Спорт"
			items={items.map((item) => ({ label: item.label, path: item.path }))}
		/>
	);
}

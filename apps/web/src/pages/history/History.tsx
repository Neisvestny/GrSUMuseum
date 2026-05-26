import SectionMenuPage from '../../components/patterns/SectionMenuPage';
import { useMenuSection } from '../../hooks/cms/useMenuSection';

export default function History() {
	const { items } = useMenuSection('history');
	return (
		<SectionMenuPage
			title="История ГрГУ"
			items={items.map((item) => ({ label: item.label, path: item.path }))}
		/>
	);
}

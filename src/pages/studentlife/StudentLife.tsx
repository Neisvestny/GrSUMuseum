import SectionMenuPage from '../../components/patterns/SectionMenuPage';
import { useMenuSection } from '../../hooks/cms/useMenuSection';

export default function StudentLife() {
	const { items } = useMenuSection('studentlife');
	return (
		<SectionMenuPage
			title="Студенческая и общетсвеннная жизнь"
			items={items.map((item) => ({ label: item.label, path: item.path }))}
		/>
	);
}

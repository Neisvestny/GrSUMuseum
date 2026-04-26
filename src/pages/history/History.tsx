import SectionMenuPage from '../../components/patterns/SectionMenuPage';

const BUTTONS = [
	{ label: 'История развития ГрГУ', path: '/history/development' },
	{ label: 'Ректоры ГрГУ', path: '/history/rectors' },
	{ label: 'Купаловцы помнят', path: '/history/memory' },
];

export default function History() {
	return <SectionMenuPage title="История ГрГУ" items={BUTTONS} />;
}

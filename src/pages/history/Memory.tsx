import SectionMenuPage from '../../components/patterns/SectionMenuPage';

const BUTTONS = [
	{ label: 'Годы Великой Отечественной войны', path: '/history/memory/vov' },
	{ label: 'Война в Афганистане', path: '/history/memory/afgan' },
];

export default function Memory() {
	return <SectionMenuPage title="Купаловцы помнят" items={BUTTONS} />;
}

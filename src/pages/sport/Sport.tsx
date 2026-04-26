import SectionMenuPage from '../../components/patterns/SectionMenuPage';

const BUTTONS = [
	{ label: 'Зал славы', path: '/sport/hall-of-fame' },
	{ label: 'Студенческий спорт', path: '/sport/student-sport' },
	{ label: 'Тренеры', path: '/sport/trainers' },
	{ label: 'Фотогалерея', path: '' },
];

export default function Sport() {
	return <SectionMenuPage title="Спорт" items={BUTTONS} />;
}

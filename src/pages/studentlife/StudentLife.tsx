import SectionMenuPage from '../../components/patterns/SectionMenuPage';

const BUTTONS = [
	{ label: 'Студенческие отряды', path: '/studentlife/students-work-teams' },
	{ label: 'Общественная жизнь', path: '/studentlife/social-life' },
	{
		label: 'Студенческие инициативы, проекты, конкурсы',
		path: '/studentlife/student-initiatives',
	},
];

export default function StudentLife() {
	return <SectionMenuPage title="Студенческая и общетсвеннная жизнь" items={BUTTONS} />;
}

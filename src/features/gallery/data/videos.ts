export interface VideoItem {
	id: number;
	src: string;
	title: string;
	description: string;
	tags: string[];
	duration?: string;
	isExternal?: boolean;
}

export const VIDEOS: VideoItem[] = [
	{
		id: 1,
		src: '/videos/opening-ceremony.mp4',
		title: 'Торжественное открытие',
		description: 'Церемония открытия нового учебного корпуса факультета математики.',
		tags: ['Мероприятия', 'Факультет'],
		duration: '8:45',
	},
	{
		id: 2,
		src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		title: 'День открытых дверей 2024',
		description: 'Обзор факультетов и возможностей для абитуриентов.',
		tags: ['Абитуриентам', 'Мероприятия'],
		duration: '15:20',
		isExternal: true,
	},
	{
		id: 3,
		src: '/videos/science-conference.mp4',
		title: 'Научная конференция',
		description: 'Ежегодная студенческая научно-практическая конференция.',
		tags: ['Наука', 'Студенты'],
		duration: '42:10',
	},
	{
		id: 4,
		src: 'https://www.youtube.com/watch?v=abcdef12345',
		title: 'Студенческий спорт',
		description: 'Межвузовские соревнования по волейболу.',
		tags: ['Спорт', 'Студенты'],
		duration: '5:30',
		isExternal: true,
	},
	{
		id: 5,
		src: '/videos/lab-tour.mp4',
		title: 'Экскурсия по лабораториям',
		description: 'Обзор современных научных лабораторий университета.',
		tags: ['Наука', 'Факультет'],
		duration: '11:00',
	},
	{
		id: 6,
		src: '/videos/graduation.mp4',
		title: 'Выпускной 2024',
		description: 'Торжественное вручение дипломов выпускникам.',
		tags: ['Мероприятия', 'Студенты'],
		duration: '28:00',
	},
];

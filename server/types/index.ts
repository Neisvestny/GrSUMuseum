export type Section = 'vov' | 'afgan' | 'olympcoch' | 'olympstud' | 'trainer';

// TODO: когда появятся новые секции (например 'sport') — добавь сюда
export function isValidSection(s: unknown): s is Section {
	return (
		s === 'vov' || s === 'afgan' || s === 'olympcoch' || s === 'olympstud' || s === 'trainer'
	);
}

export interface TeacherRow {
	id: number; // position в БД, alias AS id
	name: string;
	role: string;
	desc: string; // description в БД, alias AS desc
	img: string;
}

export interface RectorRow {
	id: number;
	position: number;
	name: string;
	years: string;
	description: string;
	full_text: string;
	img: string;
	images: string[];
	files: { name: string; url: string }[];
}

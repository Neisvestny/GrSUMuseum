import type { Rector } from '../../../../api/rectors';

export const EMPTY_RECTOR: Omit<Rector, 'id' | 'position'> = {
	name: '',
	years: '',
	description: '',
	full_text: '',
	img: '',
	images: [],
	files: [],
};

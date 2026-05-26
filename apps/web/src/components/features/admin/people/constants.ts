import type { Person, PersonMutation } from '../../../../api/people';

export const EMPTY_PERSON_FORM: PersonMutation = {
	lastName: '',
	firstName: '',
	patronymic: '',
	subtitle: '',
	yearFrom: new Date().getFullYear(),
	yearTo: null,
	shortDescription: '',
	fullDescription: '',
	img: '',
	roleSlugs: [],
	tagSlugs: [],
	categorySlugs: [],
	images: [''],
	files: [{ title: '', url: '' }],
};

export function personToForm(person: Person): PersonMutation {
	return {
		lastName: person.lastName,
		firstName: person.firstName,
		patronymic: person.patronymic ?? '',
		subtitle: person.subtitle ?? '',
		yearFrom: person.yearFrom,
		yearTo: person.yearTo,
		shortDescription: person.shortDescription ?? '',
		fullDescription: person.fullDescription ?? '',
		img: person.img ?? '',
		sortOrder: person.sortOrder,
		roleSlugs: [...person.roleSlugs],
		tagSlugs: [...person.tagSlugs],
		categorySlugs: [...person.categorySlugs],
		images: person.images.length ? person.images : [''],
		files: person.files.length
			? person.files.map((f) => ({ title: f.title, url: f.src }))
			: [{ title: '', url: '' }],
	};
}

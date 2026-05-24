import type { Person } from '../api/people';
import type { EntityItem } from '../components/patterns/EntityListDetail';

export function personToEntityItem(person: Person): EntityItem {
	return {
		id: person.id,
		name: person.displayName,
		role: person.subtitle ?? '',
		desc: person.shortDescription ?? '',
		img: person.img ?? '',
	};
}

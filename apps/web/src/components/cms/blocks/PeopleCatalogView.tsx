import type { BlockNode } from '@museum/document';
import { blockPayload, str } from './payload';
import PeopleCatalog from '../../patterns/PeopleCatalog';

export function PeopleCatalogView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const role = str(p, 'role', 'rector');
	const searchPlaceholder = str(p, 'searchPlaceholder', 'Поиск по ФИО…');
	const emptyText = str(p, 'emptyText', 'Записи не найдены');

	if (!role.trim()) return null;

	return (
		<PeopleCatalog
			role={role.trim()}
			searchPlaceholder={searchPlaceholder}
			emptyText={emptyText}
		/>
	);
}

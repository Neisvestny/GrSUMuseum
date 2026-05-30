import { useEffect, useState } from 'react';
import type { BlockNode } from '@museum/document';
import { fetchTaxonomy, type TaxonomyBundle } from '../../../../../api/people';
import { PEOPLE_ROLES } from '../../../../../lib/people-roles';
import { blockPayload, str } from '../../../../../components/cms/blocks/payload';
import { SelectInput, TextInput } from './editorHelpers';

const FALLBACK_ROLES: Array<{ value: string; label: string }> = [
	{ value: PEOPLE_ROLES.rector, label: 'Ректоры' },
	{ value: PEOPLE_ROLES.teacherVov, label: 'Преподаватели (ВОВ)' },
	{ value: PEOPLE_ROLES.teacherAfgan, label: 'Преподаватели (Афганистан)' },
	{ value: PEOPLE_ROLES.trainer, label: 'Тренеры' },
	{ value: PEOPLE_ROLES.olympicCoach, label: 'Олимпийские тренеры' },
	{ value: PEOPLE_ROLES.olympicStudent, label: 'Олимпийские студенты' },
];

export default function PeopleCatalogBlockEditor({
	block,
	onChange,
}: {
	block: BlockNode;
	onChange: (patch: Record<string, unknown>) => void;
}) {
	const p = blockPayload(block);
	const [roles, setRoles] = useState(FALLBACK_ROLES);

	useEffect(() => {
		void fetchTaxonomy()
			.then((tax: TaxonomyBundle) => {
				if (tax.roles.length) {
					setRoles(tax.roles.map((r) => ({ value: r.slug, label: r.label })));
				}
			})
			.catch(() => {
				/* fallback list */
			});
	}, []);

	return (
		<div className="flex flex-col gap-3">
			<SelectInput
				label="Роль (картотека)"
				value={str(p, 'role', PEOPLE_ROLES.rector)}
				onChange={(role) => onChange({ role })}
				options={roles}
			/>
			<TextInput
				label="Подсказка в поле поиска"
				value={str(p, 'searchPlaceholder')}
				onChange={(searchPlaceholder) => onChange({ searchPlaceholder })}
				placeholder="Поиск по ФИО…"
			/>
			<TextInput
				label="Текст при пустом списке"
				value={str(p, 'emptyText')}
				onChange={(emptyText) => onChange({ emptyText })}
				placeholder="Записи не найдены"
			/>
			<p className="text-xs text-stone-500">
				Блок на всю страницу: слева поиск и список ФИО, справа — карточка выбранного человека.
			</p>
		</div>
	);
}

import { useCallback, useEffect, useState } from 'react';
import {
	createPerson,
	deletePerson,
	fetchPeople,
	fetchPerson,
	updatePerson,
	type PeopleListFilters,
	type Person,
	type PersonMutation,
} from '../api/people';
import { ApiError } from '../shared/api/client';

export function usePeople(filters: PeopleListFilters = {}) {
	const [people, setPeople] = useState<Person[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			setPeople(await fetchPeople(filters));
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Не удалось загрузить данные');
		} finally {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		void load();
	}, [load]);

	return { people, loading, error, reload: load };
}

export function usePeopleByRole(roleSlug: string) {
	return usePeople({ role: roleSlug });
}

export function usePerson(id: number | null) {
	const [person, setPerson] = useState<Person | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (id === null || !Number.isFinite(id)) {
			setPerson(null);
			setLoading(false);
			setError('Некорректный id');
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await fetchPerson(id);
				if (!cancelled) setPerson(data);
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof ApiError ? err.message : 'Не удалось загрузить');
					setPerson(null);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [id]);

	return { person, loading, error };
}

export function usePeopleMutations(onChanged?: () => void) {
	const add = async (data: PersonMutation) => {
		const created = await createPerson(data);
		onChanged?.();
		return created;
	};

	const update = async (id: number, data: PersonMutation) => {
		const updated = await updatePerson(id, data);
		onChanged?.();
		return updated;
	};

	const remove = async (id: number) => {
		await deletePerson(id);
		onChanged?.();
	};

	return { add, update, remove };
}

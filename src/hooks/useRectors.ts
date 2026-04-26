import { useCallback, useEffect, useState } from 'react';
import {
	createRector,
	deleteRector,
	fetchRectors,
	updateRector,
	type Rector,
} from '../api/rectors';
import { ApiError } from '../shared/api/client';

export function useRectors() {
	const [rectors, setRectors] = useState<Rector[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await fetchRectors();
			setRectors(data);
		} catch (error) {
			console.error('Ошибка загрузки ректоров', error);
			setError(error instanceof ApiError ? error.message : 'Не удалось загрузить данные');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const add = async (data: Partial<Rector>) => {
		try {
			await createRector(data);
			await load();
		} catch (error) {
			console.error(error);
			throw new Error(error instanceof ApiError ? error.message : 'Ошибка при добавлении');
		}
	};

	const update = async (id: number, data: Partial<Rector>) => {
		try {
			await updateRector(id, data);
			await load();
		} catch (error) {
			console.error(error);
			throw new Error(error instanceof ApiError ? error.message : 'Ошибка при обновлении');
		}
	};

	// Без window.confirm — пусть UI сам решает что показывать
	const remove = async (id: number) => {
		try {
			await deleteRector(id);
			await load();
		} catch (error) {
			console.error(error);
			throw new Error(error instanceof ApiError ? error.message : 'Ошибка при удалении');
		}
	};

	return { rectors, loading, error, add, update, remove, reload: load };
}

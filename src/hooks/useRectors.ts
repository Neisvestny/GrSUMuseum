import { useEffect, useState } from 'react';
import {
	createRector,
	deleteRector,
	fetchRectors,
	updateRector,
	type Rector,
} from '../api/rectors';

export function useRectors() {
	const [rectors, setRectors] = useState<Rector[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await fetchRectors();
			setRectors(data);
		} catch (e) {
			console.error('Ошибка загрузки ректоров', e);
			setError('Не удалось загрузить данные');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const add = async (data: Partial<Rector>) => {
		try {
			await createRector(data);
			await load();
		} catch (e) {
			console.error(e);
			throw new Error('Ошибка при добавлении');
		}
	};

	const update = async (id: number, data: Partial<Rector>) => {
		try {
			await updateRector(id, data);
			await load();
		} catch (e) {
			console.error(e);
			throw new Error('Ошибка при обновлении');
		}
	};

	// Без window.confirm — пусть UI сам решает что показывать
	const remove = async (id: number) => {
		try {
			await deleteRector(id);
			await load();
		} catch (e) {
			console.error(e);
			throw new Error('Ошибка при удалении');
		}
	};

	return { rectors, loading, error, add, update, remove, reload: load };
}

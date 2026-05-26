import { useCallback, useEffect, useState } from 'react';
import { fetchMenuSection, type MenuItem } from '../../api/menu';
import { ApiError } from '../../shared/api/client';

export function useMenuSection(section: string) {
	const [items, setItems] = useState<MenuItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			setItems(await fetchMenuSection(section));
		} catch (error) {
			setError(error instanceof ApiError ? error.message : 'Не удалось загрузить меню');
			setItems([]);
		} finally {
			setLoading(false);
		}
	}, [section]);

	useEffect(() => {
		void load();
	}, [load]);

	return { items, loading, error, reload: load };
}

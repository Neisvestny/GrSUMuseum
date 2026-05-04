import { useCallback, useEffect, useState } from 'react';
import { fetchPageBySlug, type PageDto } from '../../api/pages';
import { ApiError } from '../../shared/api/client';

export function usePageBySlug(slug: string) {
	const [page, setPage] = useState<PageDto | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			setPage(await fetchPageBySlug(slug));
		} catch (error) {
			setError(error instanceof ApiError ? error.message : 'Не удалось загрузить страницу');
			setPage(null);
		} finally {
			setLoading(false);
		}
	}, [slug]);

	useEffect(() => {
		void load();
	}, [load]);

	return { page, loading, error, reload: load };
}

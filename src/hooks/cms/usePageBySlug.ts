import { useCallback, useEffect, useState } from 'react';
import { fetchPageByPath, fetchPageBySlug, type PageDto } from '../../api/pages';
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

export function usePageByPath(path: string) {
	const [page, setPage] = useState<PageDto | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const normalized = path.trim().replace(/^\/+|\/+$/g, '');
			if (!normalized) {
				setPage(null);
				return;
			}
			setPage(await fetchPageByPath(normalized));
		} catch (error) {
			// Backward compatibility: try legacy slug resolution for old records.
			try {
				const fallback = path
					.trim()
					.replace(/\/+$/g, '')
					.split('/')
					.filter(Boolean)
					.pop();
				if (!fallback) throw error;
				setPage(await fetchPageBySlug(fallback));
				setError(null);
			} catch (fallbackErr) {
				setError(
					fallbackErr instanceof ApiError ? fallbackErr.message : 'Не удалось загрузить страницу',
				);
				setPage(null);
			}
		} finally {
			setLoading(false);
		}
	}, [path]);

	useEffect(() => {
		void load();
	}, [load]);

	return { page, loading, error, reload: load };
}

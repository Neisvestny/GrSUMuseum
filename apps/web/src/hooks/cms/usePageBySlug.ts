import { useEffect, useState } from 'react';
import { fetchPublicPageByPath, type PublicPage } from '../../api/pages';

export function usePageByPath(path: string) {
	const [page, setPage] = useState<PublicPage | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);

		void fetchPublicPageByPath(path)
			.then((data) => {
				if (!cancelled) setPage(data);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setPage(null);
					setError(err instanceof Error ? err.message : 'Не удалось загрузить страницу');
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [path]);

	return { page, loading, error };
}

/** @deprecated use usePageByPath */
export const usePageBySlug = usePageByPath;

export function usePublishedPageBySlug(slug: string) {
	const [page, setPage] = useState<PublicPage | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);

		void import('../../api/pages')
			.then(({ fetchPublicPageBySlug }) => fetchPublicPageBySlug(slug))
			.then((data) => {
				if (!cancelled) setPage(data);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setPage(null);
					setError(err instanceof Error ? err.message : 'Не удалось загрузить страницу');
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [slug]);

	return { page, loading, error };
}

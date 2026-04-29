import { useEffect, useMemo, useState } from 'react';
import { fetchRector, type Rector } from '../api/rectors';
import { ApiError } from '../shared/api/client';

type State = {
	rector: Rector | null;
	loading: boolean;
	error: string | null;
};

export function useRector(id: number | null) {
	const [state, setState] = useState<State>({
		rector: null,
		loading: true,
		error: null,
	});

	const normalizedId = useMemo(() => (id && Number.isFinite(id) ? id : null), [id]);

	useEffect(() => {
		if (!normalizedId) {
			setState({ rector: null, loading: false, error: 'Ректор не найден' });
			return;
		}

		let cancelled = false;
		setState((s) => ({ ...s, loading: true, error: null }));

		fetchRector(normalizedId)
			.then((data) => {
				if (cancelled) return;
				setState({ rector: data, loading: false, error: null });
			})
			.catch((error) => {
				if (cancelled) return;
				setState({
					rector: null,
					loading: false,
					error:
						error instanceof ApiError
							? error.message
							: 'Не удалось загрузить данные ректора',
				});
			});

		return () => {
			cancelled = true;
		};
	}, [normalizedId]);

	return state;
}

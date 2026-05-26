const API_BASE_URL =
	(import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api';

export class ApiError extends Error {
	public readonly status: number;
	public readonly payload: unknown;

	constructor(message: string, status: number, payload: unknown) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.payload = payload;
	}
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		headers: {
			'Content-Type': 'application/json',
			...(init?.headers ?? {}),
		},
		...init,
	});

	if (!response.ok) {
		let payload: unknown = null;
		try {
			payload = await response.json();
		} catch {
			payload = null;
		}
		const message =
			typeof payload === 'object' &&
			payload !== null &&
			'error' in payload &&
			typeof (payload as { error?: unknown }).error === 'string'
				? (payload as { error: string }).error
				: `Request failed with status ${response.status}`;
		throw new ApiError(message, response.status, payload);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}

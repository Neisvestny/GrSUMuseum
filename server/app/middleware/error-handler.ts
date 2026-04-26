import type { ErrorRequestHandler } from 'express';
import { isHttpError } from '../../shared/errors';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
	if (isHttpError(error)) {
		res.status(error.statusCode).json({ error: error.message });
		return;
	}

	console.error('[server] unhandled error:', error);
	res.status(500).json({ error: 'Внутренняя ошибка сервера' });
};

import type { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiMessage } from '../../shared/api-messages';
import { isHttpError } from '../../shared/errors';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
	if (isHttpError(error)) {
		res.status(error.statusCode).json({ error: error.message });
		return;
	}

	console.error('[server] unhandled error:', error);
	res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ApiMessage.INTERNAL_ERROR });
};

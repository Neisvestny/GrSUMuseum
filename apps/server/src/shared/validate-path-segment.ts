import { StatusCodes } from 'http-status-codes';
import { HttpError } from './errors.js';
import { ApiMessage } from './api-messages.js';

export function requireNonEmptyString(value: unknown, message: string): string {
	if (typeof value !== 'string' || !value.trim()) {
		throw new HttpError(StatusCodes.BAD_REQUEST, message);
	}
	return value.trim();
}

export function requireSafePathSegment(value: unknown, requiredMessage: string): string {
	const name = requireNonEmptyString(value, requiredMessage);
	if (name.includes('/') || name.includes('\\')) {
		throw new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.INVALID_NAME);
	}
	return name;
}

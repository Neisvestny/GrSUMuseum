import type { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { StatusCodes } from 'http-status-codes';
import { auth } from '../../auth/index.js';
import { ApiMessage } from '../../shared/api-messages.js';
import { HttpError } from '../../shared/errors.js';

export type AuthenticatedRequest = Request & {
	user: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user'];
	session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['session'];
};

export async function getSessionFromRequest(req: Request) {
	return auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});
}

export async function requireAuth(
	req: Request,
	_res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const session = await getSessionFromRequest(req);
		if (!session?.user || !session.session) {
			next(new HttpError(StatusCodes.UNAUTHORIZED, ApiMessage.UNAUTHORIZED));
			return;
		}

		const authed = req as AuthenticatedRequest;
		authed.user = session.user;
		authed.session = session.session;
		next();
	} catch (err) {
		next(err);
	}
}

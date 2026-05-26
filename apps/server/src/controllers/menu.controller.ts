import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { MenuService } from '../services/menu.service';
import { ApiMessage } from '../shared/api-messages';
import { HttpError } from '../shared/errors';

export class MenuController {
	constructor(private service: MenuService) {}

	listBySection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const raw = req.params.section;
		const section = (typeof raw === 'string' ? raw : (raw?.[0] ?? '')).trim();
		if (!section) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.SECTION_REQUIRED));
			return;
		}
		const includeInactive = req.query.includeInactive === 'true';
		try {
			res.json(await this.service.listBySection(section, includeInactive));
		} catch (err) {
			next(err);
		}
	};

	listAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			res.json(await this.service.listAll());
		} catch (err) {
			next(err);
		}
	};

	create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		if (!isMenuItemPayload(req.body)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.INVALID_BODY));
			return;
		}
		try {
			const item = await this.service.create(req.body);
			res.status(StatusCodes.CREATED).json(item);
		} catch (err) {
			next(err);
		}
	};

	update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		if (!isMenuItemPayload(req.body)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.INVALID_BODY));
			return;
		}
		try {
			const item = await this.service.update(id, req.body);
			if (!item) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.MENU_ITEM_NOT_FOUND));
				return;
			}
			res.json(item);
		} catch (err) {
			next(err);
		}
	};

	delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		try {
			const ok = await this.service.delete(id);
			if (!ok) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.MENU_ITEM_NOT_FOUND));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};
}

function isMenuItemPayload(value: unknown): value is {
	section?: string;
	label?: string;
	path?: string;
	is_active?: boolean;
	position?: number;
} {
	if (typeof value !== 'object' || value === null) return false;
	const data = value as Record<string, unknown>;
	return (
		(data.section === undefined || typeof data.section === 'string') &&
		(data.label === undefined || typeof data.label === 'string') &&
		(data.path === undefined || typeof data.path === 'string') &&
		(data.is_active === undefined || typeof data.is_active === 'boolean') &&
		(data.position === undefined || typeof data.position === 'number')
	);
}

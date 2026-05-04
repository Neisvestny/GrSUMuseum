import type { NextFunction, Request, Response } from 'express';
import type { MenuService } from '../services/menu.service';
import { HttpError } from '../shared/errors';

export class MenuController {
	constructor(private service: MenuService) {}

	// GET /api/menu/:section
	listBySection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const raw = req.params.section;
		const section = (typeof raw === 'string' ? raw : (raw?.[0] ?? '')).trim();
		if (!section) {
			next(new HttpError(400, 'section обязателен'));
			return;
		}
		const includeInactive = req.query.includeInactive === 'true';
		try {
			res.json(await this.service.listBySection(section, includeInactive));
		} catch (err) {
			next(err);
		}
	};

	// GET /api/menu
	listAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			res.json(await this.service.listAll());
		} catch (err) {
			next(err);
		}
	};

	// POST /api/menu
	create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		if (!isMenuItemPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const item = await this.service.create(req.body);
			res.status(201).json(item);
		} catch (err) {
			next(err);
		}
	};

	// PUT /api/menu/:id
	update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}
		if (!isMenuItemPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const item = await this.service.update(id, req.body);
			if (!item) {
				next(new HttpError(404, 'Пункт меню не найден'));
				return;
			}
			res.json(item);
		} catch (err) {
			next(err);
		}
	};

	// DELETE /api/menu/:id
	delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}
		try {
			const ok = await this.service.delete(id);
			if (!ok) {
				next(new HttpError(404, 'Пункт меню не найден'));
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

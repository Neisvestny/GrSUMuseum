import type { NextFunction, Request, Response } from 'express';
import type { RectorsService } from '../services/rectors.service';
import { HttpError } from '../shared/errors';

export class RectorsController {
	constructor(private service: RectorsService) {}

	// GET /api/rectors
	getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const rectors = await this.service.getAll();
			res.json(rectors);
		} catch (err) {
			next(err);
		}
	};

	// GET /api/rectors/:id
	getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (isNaN(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}

		try {
			const rector = await this.service.getById(id);
			if (!rector) {
				next(new HttpError(404, 'Ректор не найден'));
				return;
			}
			res.json(rector);
		} catch (err) {
			next(err);
		}
	};

	// POST /api/rectors
	create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		if (!isRectorPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const rector = await this.service.create(req.body);
			res.status(201).json(rector);
		} catch (err) {
			next(err);
		}
	};

	// PUT /api/rectors/:id
	update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (isNaN(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}
		if (!isRectorPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}

		try {
			const rector = await this.service.update(id, req.body);
			if (!rector) {
				next(new HttpError(404, 'Ректор не найден'));
				return;
			}
			res.json(rector);
		} catch (err) {
			next(err);
		}
	};

	// DELETE /api/rectors/:id
	delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (isNaN(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}

		try {
			const deleted = await this.service.delete(id);
			if (!deleted) {
				next(new HttpError(404, 'Ректор не найден'));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};
}

function isRectorPayload(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const data = value as Record<string, unknown>;
	const isFilesValid =
		data.files === undefined ||
		(Array.isArray(data.files) &&
			data.files.every(
				(file) =>
					typeof file === 'object' &&
					file !== null &&
					'name' in file &&
					'url' in file &&
					typeof (file as { name: unknown }).name === 'string' &&
					typeof (file as { url: unknown }).url === 'string',
			));
	const isImagesValid =
		data.images === undefined ||
		(Array.isArray(data.images) && data.images.every((image) => typeof image === 'string'));

	return (
		(data.name === undefined || typeof data.name === 'string') &&
		(data.years === undefined || typeof data.years === 'string') &&
		(data.description === undefined || typeof data.description === 'string') &&
		(data.full_text === undefined || typeof data.full_text === 'string') &&
		(data.img === undefined || typeof data.img === 'string') &&
		(data.position === undefined || typeof data.position === 'number') &&
		isImagesValid &&
		isFilesValid
	);
}

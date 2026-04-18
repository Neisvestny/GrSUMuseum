// Контроллер — только HTTP-логика: валидация, вызов сервиса, ответ.
// Никакого SQL и бизнес-логики здесь быть не должно.

import type { Request, Response } from 'express';
import type { RectorsService } from '../services/rectors.service';

export class RectorsController {
	constructor(private service: RectorsService) {}

	// GET /api/rectors
	getAll = async (_req: Request, res: Response): Promise<void> => {
		try {
			const rectors = await this.service.getAll();
			res.json(rectors);
		} catch (err) {
			console.error('[rectors] getAll error:', err);
			res.status(500).json({ error: 'Ошибка базы данных' });
		}
	};

	// GET /api/rectors/:id
	getById = async (req: Request, res: Response): Promise<void> => {
		const id = Number(req.params.id);
		if (isNaN(id)) {
			res.status(400).json({ error: 'id должен быть числом' });
			return;
		}

		try {
			const rector = await this.service.getById(id);
			if (!rector) {
				res.status(404).json({ error: 'Ректор не найден' });
				return;
			}
			res.json(rector);
		} catch (err) {
			console.error('[rectors] getById error:', err);
			res.status(500).json({ error: 'Ошибка базы данных' });
		}
	};

	// POST /api/rectors
	create = async (req: Request, res: Response): Promise<void> => {
		// TODO: добавить валидацию тела запроса (например через zod)
		// чтобы клиент получал внятные ошибки если забыл передать name
		try {
			const rector = await this.service.create(req.body);
			res.status(201).json(rector);
		} catch (err) {
			console.error('[rectors] create error:', err);
			res.status(500).json({ error: 'Ошибка базы данных' });
		}
	};

	// PUT /api/rectors/:id
	update = async (req: Request, res: Response): Promise<void> => {
		const id = Number(req.params.id);
		if (isNaN(id)) {
			res.status(400).json({ error: 'id должен быть числом' });
			return;
		}

		try {
			const rector = await this.service.update(id, req.body);
			if (!rector) {
				res.status(404).json({ error: 'Ректор не найден' });
				return;
			}
			res.json(rector);
		} catch (err) {
			console.error('[rectors] update error:', err);
			res.status(500).json({ error: 'Ошибка базы данных' });
		}
	};

	// DELETE /api/rectors/:id
	delete = async (req: Request, res: Response): Promise<void> => {
		const id = Number(req.params.id);
		if (isNaN(id)) {
			res.status(400).json({ error: 'id должен быть числом' });
			return;
		}

		try {
			const deleted = await this.service.delete(id);
			if (!deleted) {
				res.status(404).json({ error: 'Ректор не найден' });
				return;
			}
			res.json({ success: true });
		} catch (err) {
			console.error('[rectors] delete error:', err);
			res.status(500).json({ error: 'Ошибка базы данных' });
		}
	};
}

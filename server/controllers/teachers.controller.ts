import type { Request, Response } from 'express';
import { isValidSection } from '../types';
import type { TeachersService } from './../services/teachers.service';

export class TeachersController {
	constructor(private service: TeachersService) {}

	// GET /api/teachers/:section
	getAll = async (req: Request, res: Response): Promise<void> => {
		const { section } = req.params;
		if (!isValidSection(section)) {
			res.status(400).json({
				error: 'Неверная секция. Используй: vov | afgan',
			});
			return;
		}

		try {
			const teachers = await this.service.getAll(section);
			res.json(teachers);
		} catch (err) {
			console.error('[teachers] getAll error:', err);
			res.status(500).json({ error: 'Ошибка базы данных' });
		}
	};

	// POST /api/teachers/:section
	create = async (req: Request, res: Response): Promise<void> => {
		const { section } = req.params;
		if (!isValidSection(section)) {
			res.status(400).json({
				error: 'Неверная секция. Используй: vov | afgan',
			});
			return;
		}

		try {
			const teacher = await this.service.create(section, req.body);
			res.status(201).json(teacher);
		} catch (err) {
			console.error('[teachers] create error:', err);
			res.status(500).json({ error: 'Ошибка базы данных' });
		}
	};

	// PUT /api/teachers/:section/:position
	update = async (req: Request, res: Response): Promise<void> => {
		const { section } = req.params;
		const currentPos = Number(req.params.position);

		if (!isValidSection(section)) {
			res.status(400).json({
				error: 'Неверная секция. Используй: vov | afgan',
			});
			return;
		}
		if (isNaN(currentPos)) {
			res.status(400).json({ error: 'position должен быть числом' });
			return;
		}

		try {
			const teacher = await this.service.update(section, currentPos, req.body);
			if (!teacher) {
				res.status(404).json({ error: 'Преподаватель не найден' });
				return;
			}
			res.json(teacher);
		} catch (err) {
			console.error('[teachers] update error:', err);
			res.status(500).json({ error: 'Ошибка базы данных' });
		}
	};

	// DELETE /api/teachers/:section/:position
	delete = async (req: Request, res: Response): Promise<void> => {
		const { section } = req.params;
		const pos = Number(req.params.position);

		if (!isValidSection(section)) {
			res.status(400).json({
				error: 'Неверная секция. Используй: vov | afgan',
			});
			return;
		}
		if (isNaN(pos)) {
			res.status(400).json({ error: 'position должен быть числом' });
			return;
		}

		try {
			const deleted = await this.service.delete(section, pos);
			if (!deleted) {
				res.status(404).json({ error: 'Преподаватель не найден' });
				return;
			}
			res.json({ success: true });
		} catch (err) {
			console.error('[teachers] delete error:', err);
			res.status(500).json({ error: 'Ошибка базы данных' });
		}
	};

	// POST /api/teachers/:section/reset
	reset = async (req: Request, res: Response): Promise<void> => {
		const { section } = req.params;
		if (!isValidSection(section)) {
			res.status(400).json({
				error: 'Неверная секция. Используй: vov | afgan',
			});
			return;
		}

		try {
			const teachers = await this.service.reset(section);
			res.json(teachers);
		} catch (err) {
			console.error('[teachers] reset error:', err);
			res.status(500).json({ error: 'Ошибка базы данных' });
		}
	};
}

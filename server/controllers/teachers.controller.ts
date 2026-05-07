import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../shared/errors';
import { isValidSection } from '../types';
import type { TeachersService } from './../services/teachers.service';

export class TeachersController {
	constructor(private service: TeachersService) {}

	// GET /api/teachers/:section
	getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { section } = req.params;
		if (!isValidSection(section)) {
			next(
				new HttpError(
					400,
					'Неверная секция. Используй: vov | afgan | olympcoch | olympstud | trainer',
				),
			);
			return;
		}

		try {
			const teachers = await this.service.getAll(section);
			res.json(teachers);
		} catch (err) {
			next(err);
		}
	};

	// POST /api/teachers/:section
	create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { section } = req.params;
		if (!isValidSection(section)) {
			next(
				new HttpError(
					400,
					'Неверная секция. Используй: vov | afgan | olympcoch | olympstud | trainer',
				),
			);
			return;
		}
		if (!isTeacherPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}

		try {
			const teacher = await this.service.create(section, req.body);
			res.status(201).json(teacher);
		} catch (err) {
			next(err);
		}
	};

	// PUT /api/teachers/:section/:position
	update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { section } = req.params;
		const currentPos = Number(req.params.position);

		if (!isValidSection(section)) {
			next(
				new HttpError(
					400,
					'Неверная секция. Используй: vov | afgan | olympcoch | olympstud | trainer',
				),
			);
			return;
		}
		if (isNaN(currentPos)) {
			next(new HttpError(400, 'position должен быть числом'));
			return;
		}
		if (!isTeacherPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}

		try {
			const teacher = await this.service.update(section, currentPos, req.body);
			if (!teacher) {
				next(new HttpError(404, 'Преподаватель не найден'));
				return;
			}
			res.json(teacher);
		} catch (err) {
			next(err);
		}
	};

	// DELETE /api/teachers/:section/:position
	delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { section } = req.params;
		const pos = Number(req.params.position);

		if (!isValidSection(section)) {
			next(
				new HttpError(
					400,
					'Неверная секция. Используй: vov | afgan | olympcoch | olympstud | trainer',
				),
			);
			return;
		}
		if (isNaN(pos)) {
			next(new HttpError(400, 'position должен быть числом'));
			return;
		}

		try {
			const deleted = await this.service.delete(section, pos);
			if (!deleted) {
				next(new HttpError(404, 'Преподаватель не найден'));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	// POST /api/teachers/:section/reset
	reset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { section } = req.params;
		if (!isValidSection(section)) {
			next(
				new HttpError(
					400,
					'Неверная секция. Используй: vov | afgan | olympcoch | olympstud | trainer',
				),
			);
			return;
		}

		try {
			const teachers = await this.service.reset(section);
			res.json(teachers);
		} catch (err) {
			next(err);
		}
	};

	// PATCH /api/teachers/:section/reorder
	reorder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const { section } = req.params;
		if (!isValidSection(section)) {
			next(
				new HttpError(
					400,
					'Неверная секция. Используй: vov | afgan | olympcoch | olympstud | trainer',
				),
			);
			return;
		}

		const orderedPositions = Array.isArray(req.body?.orderedPositions)
			? req.body.orderedPositions
			: null;
		if (
			!orderedPositions ||
			!orderedPositions.every((n: unknown) => typeof n === 'number' && Number.isFinite(n))
		) {
			next(new HttpError(400, 'orderedPositions должен быть массивом чисел'));
			return;
		}

		try {
			await this.service.reorder(section, orderedPositions as number[]);
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};
}

function isTeacherPayload(value: unknown): value is {
	name?: string;
	role?: string;
	desc?: string;
	img?: string;
	position?: number;
} {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const data = value as Record<string, unknown>;
	return (
		(data.name === undefined || typeof data.name === 'string') &&
		(data.role === undefined || typeof data.role === 'string') &&
		(data.desc === undefined || typeof data.desc === 'string') &&
		(data.img === undefined || typeof data.img === 'string') &&
		(data.position === undefined || typeof data.position === 'number')
	);
}

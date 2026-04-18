import { Request, Response, Router } from 'express';
import { pool } from './../db';

export const teachersRouter = Router();

type Section = 'vov' | 'afgan';

function isValidSection(s: unknown): s is Section {
	return s === 'vov' || s === 'afgan';
}

// GET /api/teachers/:section — получить всех преподавателей секции
teachersRouter.get('/:section', async (req: Request, res: Response) => {
	const { section } = req.params;

	if (!isValidSection(section)) {
		return res
			.status(400)
			.json({ error: 'Invalid section. Use vov or afgan.' });
	}

	try {
		const result = await pool.query(
			`SELECT position AS id, name, role, description AS desc, img
       FROM teachers
       WHERE section = $1
       ORDER BY position ASC`,
			[section],
		);
		res.json(result.rows);
	} catch (err) {
		console.error(err);
		console.log('!!!!!!!!!!!!!!!!!!' + process.env.DB_HOST);

		res.status(500).json({ error: 'Database error' });
	}
});

// POST /api/teachers/:section — добавить преподавателя
// Body: { name?, role?, desc?, img?, position? }
// Если position передан — вставляем на эту позицию и сдвигаем остальных
teachersRouter.post('/:section', async (req: Request, res: Response) => {
	const { section } = req.params;

	if (!isValidSection(section)) {
		return res.status(400).json({ error: 'Invalid section.' });
	}

	const {
		name = 'Новый преподаватель',
		role = '',
		desc = '',
		img = '',
		position,
	} = req.body;

	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// Считаем текущее количество записей
		const countResult = await client.query(
			'SELECT COUNT(*) FROM teachers WHERE section = $1',
			[section],
		);
		const count = Number(countResult.rows[0].count);

		// Определяем позицию вставки
		let insertPos: number;
		if (position !== undefined) {
			insertPos = Math.max(1, Math.min(Number(position), count + 1));
		} else {
			insertPos = count + 1;
		}

		// Сдвигаем вниз
		await client.query(
			`UPDATE teachers
   SET position = position + 1
   WHERE section = $1 AND position >= $2`,
			[section, insertPos],
		);

		// Вставляем
		const result = await client.query(
			`INSERT INTO teachers (section, position, name, role, description, img)
   VALUES ($1, $2, $3, $4, $5, $6)
   RETURNING position AS id, name, role, description AS desc, img`,
			[section, insertPos, name, role, desc, img],
		);

		await client.query('COMMIT');
		res.status(201).json(result.rows[0]);
	} catch (err) {
		await client.query('ROLLBACK');
		console.error(err);
		res.status(500).json({ error: 'Database error' });
	} finally {
		client.release();
	}
});

// PUT /api/teachers/:section/:position — обновить преподавателя
// Body: { name?, role?, desc?, img?, position? }
// Если передаётся новый position — перемещаем запись
teachersRouter.put(
	'/:section/:position',
	async (req: Request, res: Response) => {
		const { section } = req.params;
		const currentPos = Number(req.params.position);

		if (!isValidSection(section) || isNaN(currentPos)) {
			return res.status(400).json({ error: 'Invalid params.' });
		}

		const { name, role, desc, img, position: newPos } = req.body;

		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			// Проверяем что запись существует
			const existing = await client.query(
				'SELECT * FROM teachers WHERE section = $1 AND position = $2',
				[section, currentPos],
			);
			if (existing.rows.length === 0) {
				await client.query('ROLLBACK');
				return res.status(404).json({ error: 'Teacher not found.' });
			}

			// Если меняется позиция — перемещаем
			if (newPos !== undefined && Number(newPos) !== currentPos) {
				const targetPos = Number(newPos);

				const countResult = await client.query(
					'SELECT COUNT(*) FROM teachers WHERE section = $1',
					[section],
				);
				const count = Number(countResult.rows[0].count);
				const clampedTarget = Math.max(1, Math.min(targetPos, count));

				// Временно ставим position = 0 чтобы избежать конфликта уникальности
				await client.query(
					'UPDATE teachers SET position = 0 WHERE section = $1 AND position = $2',
					[section, currentPos],
				);

				if (clampedTarget > currentPos) {
					// Сдвигаем вниз всех между currentPos+1 и clampedTarget
					await client.query(
						`UPDATE teachers
           SET position = position - 1
           WHERE section = $1 AND position > $2 AND position <= $3`,
						[section, currentPos, clampedTarget],
					);
				} else {
					// Сдвигаем вверх всех между clampedTarget и currentPos-1
					await client.query(
						`UPDATE teachers
           SET position = position + 1
           WHERE section = $1 AND position >= $2 AND position < $3`,
						[section, clampedTarget, currentPos],
					);
				}

				// Устанавливаем новую позицию
				await client.query(
					`UPDATE teachers
         SET position = $1,
             name = COALESCE($2, name),
             role = COALESCE($3, role),
             description = COALESCE($4, description),
             img = COALESCE($5, img)
         WHERE section = $6 AND position = 0`,
					[
						clampedTarget,
						name ?? null,
						role ?? null,
						desc ?? null,
						img ?? null,
						section,
					],
				);
			} else {
				// Просто обновляем поля без смены позиции
				await client.query(
					`UPDATE teachers
         SET name = COALESCE($1, name),
             role = COALESCE($2, role),
             description = COALESCE($3, description),
             img = COALESCE($4, img)
         WHERE section = $5 AND position = $6`,
					[
						name ?? null,
						role ?? null,
						desc ?? null,
						img ?? null,
						section,
						currentPos,
					],
				);
			}

			await client.query('COMMIT');

			const updated = await pool.query(
				`SELECT position AS id, name, role, description AS desc, img
       FROM teachers WHERE section = $1 AND position = $2`,
				[section, newPos !== undefined ? Number(newPos) : currentPos],
			);

			res.json(updated.rows[0]);
		} catch (err) {
			await client.query('ROLLBACK');
			console.error(err);
			res.status(500).json({ error: 'Database error' });
		} finally {
			client.release();
		}
	},
);

// DELETE /api/teachers/:section/:position — удалить преподавателя
teachersRouter.delete(
	'/:section/:position',
	async (req: Request, res: Response) => {
		const { section } = req.params;
		const pos = Number(req.params.position);

		if (!isValidSection(section) || isNaN(pos)) {
			return res.status(400).json({ error: 'Invalid params.' });
		}

		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			const result = await client.query(
				'DELETE FROM teachers WHERE section = $1 AND position = $2 RETURNING *',
				[section, pos],
			);

			if (result.rows.length === 0) {
				await client.query('ROLLBACK');
				return res.status(404).json({ error: 'Teacher not found.' });
			}

			// Сдвигаем позиции вниз после удалённой
			await client.query(
				`UPDATE teachers
       SET position = position - 1
       WHERE section = $1 AND position > $2`,
				[section, pos],
			);

			await client.query('COMMIT');
			res.json({ success: true });
		} catch (err) {
			await client.query('ROLLBACK');
			console.error(err);
			res.status(500).json({ error: 'Database error' });
		} finally {
			client.release();
		}
	},
);

// POST /api/teachers/:section/reset — сбросить к начальным данным
teachersRouter.post('/:section/reset', async (req: Request, res: Response) => {
	const { section } = req.params;

	if (!isValidSection(section)) {
		return res.status(400).json({ error: 'Invalid section.' });
	}

	const defaults = [
		{
			position: 1,
			name: 'Иванов Иван Иванович',
			role: 'Профессор кафедры математики',
			desc: 'Участник Великой Отечественной войны. После победы вернулся в университет и посвятил жизнь науке.',
			img: '/images/teacher-1.jpg',
		},
		{
			position: 2,
			name: 'Петрова Мария Степановна',
			role: 'Доцент кафедры истории',
			desc: 'Ветеран труда, воспитала несколько поколений историков. Её лекции помнят выпускники до сих пор.',
			img: '/images/teacher-2.jpg',
		},
		{
			position: 3,
			name: 'Сидоров Николай Фёдорович',
			role: 'Заведующий кафедрой физики',
			desc: 'Доктор физико-математических наук. Внёс вклад в развитие ядерной физики в послевоенные годы.',
			img: '/images/teacher-3.jpg',
		},
	];

	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query('DELETE FROM teachers WHERE section = $1', [
			section,
		]);
		for (const t of defaults) {
			await client.query(
				'INSERT INTO teachers (section, position, name, role, description, img) VALUES ($1, $2, $3, $4, $5, $6)',
				[section, t.position, t.name, t.role, t.desc, t.img],
			);
		}
		await client.query('COMMIT');

		const result = await pool.query(
			`SELECT position AS id, name, role, description AS desc, img
       FROM teachers WHERE section = $1 ORDER BY position`,
			[section],
		);
		res.json(result.rows);
	} catch (err) {
		await client.query('ROLLBACK');
		console.error(err);
		res.status(500).json({ error: 'Database error' });
	} finally {
		client.release();
	}
});

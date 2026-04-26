import type { Pool } from 'pg';
import type { Section, TeacherRow } from '../types';

export class TeachersService {
	constructor(private db: Pool) {}

	// Получить всех преподавателей секции, отсортированных по позиции
	async getAll(section: Section): Promise<TeacherRow[]> {
		const result = await this.db.query<TeacherRow>(
			`SELECT position AS id, name, role, description AS desc, img
            FROM teachers
            WHERE section = $1
            ORDER BY position ASC`,
			[section],
		);
		return result.rows;
	}

	// Создать преподавателя.
	// Если position не передан — вставляем в конец списка.
	// Если передан — сдвигаем остальных вниз и вставляем на нужное место.
	async create(
		section: Section,
		data: {
			name?: string;
			role?: string;
			desc?: string;
			img?: string;
			position?: number;
		},
	): Promise<TeacherRow> {
		const { name = 'Новый преподаватель', role = '', desc = '', img = '', position } = data;

		const client = await this.db.connect();
		try {
			await client.query('BEGIN');

			const countRes = await client.query<{ count: string }>(
				'SELECT COUNT(*) FROM teachers WHERE section = $1',
				[section],
			);
			const count = Number(countRes.rows[0].count);

			// Зажимаем позицию в допустимый диапазон [1, count+1]
			const insertPos =
				position !== undefined
					? Math.max(1, Math.min(Number(position), count + 1))
					: count + 1;

			// Сдвигаем вниз всех у кого position >= insertPos
			await client.query(
				`UPDATE teachers
                SET position = position + 1
                WHERE section = $1 AND position >= $2`,
				[section, insertPos],
			);

			const result = await client.query<TeacherRow>(
				`INSERT INTO teachers (section, position, name, role, description, img)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING position AS id, name, role, description AS desc, img`,
				[section, insertPos, name, role, desc, img],
			);

			await client.query('COMMIT');
			return result.rows[0];
		} catch (err) {
			await client.query('ROLLBACK');
			// FIXME: если упадёт уникальный индекс на position — здесь будет невнятная ошибка.
			// Нужно поймать PostgresError с code '23505' и бросать понятное сообщение.
			throw err;
		} finally {
			client.release();
		}
	}

	// Обновить преподавателя по позиции.
	// Если передан новый position — перемещаем запись, сдвигая соседей.
	async update(
		section: Section,
		currentPos: number,
		data: {
			name?: string;
			role?: string;
			desc?: string;
			img?: string;
			position?: number;
		},
	): Promise<TeacherRow | null> {
		const { name, role, desc, img, position: newPos } = data;

		const client = await this.db.connect();
		try {
			await client.query('BEGIN');

			// Проверяем что запись вообще существует
			const existing = await client.query(
				'SELECT * FROM teachers WHERE section = $1 AND position = $2',
				[section, currentPos],
			);
			if (existing.rows.length === 0) return null;

			if (newPos !== undefined && Number(newPos) !== currentPos) {
				// Перемещение записи
				const countRes = await client.query<{ count: string }>(
					'SELECT COUNT(*) FROM teachers WHERE section = $1',
					[section],
				);
				const count = Number(countRes.rows[0].count);
				const targetPos = Math.max(1, Math.min(Number(newPos), count));

				// Временно ставим position = 0 чтобы не словить конфликт уникальности
				await client.query(
					'UPDATE teachers SET position = 0 WHERE section = $1 AND position = $2',
					[section, currentPos],
				);

				if (targetPos > currentPos) {
					// Сдвигаем вверх всех между currentPos+1 и targetPos
					await client.query(
						`UPDATE teachers
                        SET position = position - 1
                        WHERE section = $1 AND position > $2 AND position <= $3`,
						[section, currentPos, targetPos],
					);
				} else {
					// Сдвигаем вниз всех между targetPos и currentPos-1
					await client.query(
						`UPDATE teachers
                        SET position = position + 1
                        WHERE section = $1 AND position >= $2 AND position < $3`,
						[section, targetPos, currentPos],
					);
				}

				await client.query(
					`UPDATE teachers
                    SET position    = $1,
                        name        = COALESCE($2, name),
                        role        = COALESCE($3, role),
                        description = COALESCE($4, description),
                        img         = COALESCE($5, img)
                    WHERE section = $6 AND position = 0`,
					[targetPos, name ?? null, role ?? null, desc ?? null, img ?? null, section],
				);
			} else {
				// Просто обновляем поля без смены позиции
				await client.query(
					`UPDATE teachers
                    SET name        = COALESCE($1, name),
                        role        = COALESCE($2, role),
                        description = COALESCE($3, description),
                        img         = COALESCE($4, img)
                    WHERE section = $5 AND position = $6`,
					[name ?? null, role ?? null, desc ?? null, img ?? null, section, currentPos],
				);
			}

			await client.query('COMMIT');

			const finalPos = newPos !== undefined ? Number(newPos) : currentPos;
			const updated = await this.db.query<TeacherRow>(
				`SELECT position AS id, name, role, description AS desc, img
                FROM teachers WHERE section = $1 AND position = $2`,
				[section, finalPos],
			);
			return updated.rows[0] ?? null;
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	}

	// Удалить преподавателя по позиции и сдвинуть остальных
	async delete(section: Section, pos: number): Promise<boolean> {
		const client = await this.db.connect();
		try {
			await client.query('BEGIN');

			const result = await client.query(
				'DELETE FROM teachers WHERE section = $1 AND position = $2 RETURNING *',
				[section, pos],
			);

			if (result.rows.length === 0) {
				await client.query('ROLLBACK');
				return false; // не нашли — вернём false, контроллер отдаст 404
			}

			await client.query(
				`UPDATE teachers
                SET position = position - 1
                WHERE section = $1 AND position > $2`,
				[section, pos],
			);

			await client.query('COMMIT');
			return true;
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	}

	// Сбросить список к дефолтным данным.
	// TODO: вынести дефолтные данные в отдельный файл seeds/teachers.seed.ts
	// чтобы их можно было менять не трогая бизнес-логику
	async reset(section: Section): Promise<TeacherRow[]> {
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

		const client = await this.db.connect();
		try {
			await client.query('BEGIN');
			await client.query('DELETE FROM teachers WHERE section = $1', [section]);

			for (const t of defaults) {
				await client.query(
					`INSERT INTO teachers (section, position, name, role, description, img)
                    VALUES ($1, $2, $3, $4, $5, $6)`,
					[section, t.position, t.name, t.role, t.desc, t.img],
				);
			}

			await client.query('COMMIT');

			const result = await this.db.query<TeacherRow>(
				`SELECT position AS id, name, role, description AS desc, img
                FROM teachers WHERE section = $1 ORDER BY position`,
				[section],
			);
			return result.rows;
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	}
}

// Сервис — вся бизнес-логика и SQL-запросы для ректоров.
// FIXME: поле files хранится как JSONB, но pg драйвер возвращает его уже
// как объект — не нужно делать JSON.parse на клиенте. Не ломай это.

import { Pool } from 'pg';
import type { RectorRow } from '../types';

type FileItem = { name: string; url: string };

interface RectorInput {
	name?: string;
	years?: string;
	description?: string;
	full_text?: string;
	img?: string;
	images?: string[];
	files?: FileItem[];
	position?: number;
}

export class RectorsService {
	constructor(private db: Pool) {}

	// Получить всех ректоров, отсортированных по позиции
	async getAll(): Promise<RectorRow[]> {
		const result = await this.db.query<RectorRow>(
			'SELECT * FROM rectors ORDER BY position ASC',
		);
		return result.rows;
	}

	// Получить одного ректора по id.
	// Возвращает null если не найден — контроллер решает что отдать клиенту.
	async getById(id: number): Promise<RectorRow | null> {
		const result = await this.db.query<RectorRow>('SELECT * FROM rectors WHERE id = $1', [id]);
		return result.rows[0] ?? null;
	}

	// Создать ректора.
	// images передаём напрямую — pg сам сериализует TEXT[].
	// files — JSON.stringify потому что колонка JSONB принимает строку.
	async create(data: RectorInput): Promise<RectorRow> {
		const {
			name = '',
			years = '',
			description = '',
			full_text = '',
			img = '',
			images = [],
			files = [],
			position,
		} = data;

		// Фильтруем мусор — пустые строки в массивах не нужны в БД
		const cleanImages = images.filter((s) => s.trim() !== '');
		const cleanFiles = files.filter((f) => f.name.trim() !== '' || f.url.trim() !== '');

		const client = await this.db.connect();
		try {
			await client.query('BEGIN');

			const countRes = await client.query<{ count: string }>('SELECT COUNT(*) FROM rectors');
			const count = Number(countRes.rows[0].count);
			const insertPos =
				position !== undefined
					? Math.max(1, Math.min(Number(position), count + 1))
					: count + 1;

			await client.query('UPDATE rectors SET position = position + 1 WHERE position >= $1', [
				insertPos,
			]);

			const result = await client.query<RectorRow>(
				`INSERT INTO rectors
                    (position, name, years, description, full_text, img, images, files)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
				[
					insertPos,
					name,
					years,
					description,
					full_text,
					img,
					cleanImages,
					JSON.stringify(cleanFiles),
				],
			);

			await client.query('COMMIT');
			return result.rows[0];
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	}

	// Обновить ректора по id.
	// COALESCE — не трогаем поля которые не были переданы в теле запроса.
	async update(id: number, data: RectorInput): Promise<RectorRow | null> {
		const { name, years, description, full_text, img, images, files, position } = data;

		// Фильтруем пустые строки только если массив вообще был передан
		const cleanImages = images?.filter((s) => s.trim() !== '');
		const cleanFiles = files?.filter((f) => f.name.trim() !== '' || f.url.trim() !== '');

		const client = await this.db.connect();
		try {
			await client.query('BEGIN');

			const existing = await client.query<RectorRow>('SELECT * FROM rectors WHERE id = $1', [
				id,
			]);
			if (existing.rows.length === 0) return null;

			const current = existing.rows[0];

			// Если позиция изменилась — переставляем запись
			if (position !== undefined && Number(position) !== current.position) {
				const countRes = await client.query<{ count: string }>(
					'SELECT COUNT(*) FROM rectors',
				);
				const count = Number(countRes.rows[0].count);
				const targetPos = Math.max(1, Math.min(Number(position), count));
				const currentPos: number = current.position;

				// Временно убираем из очереди чтобы не было конфликта уникальности
				await client.query('UPDATE rectors SET position = 0 WHERE id = $1', [id]);

				if (targetPos > currentPos) {
					await client.query(
						`UPDATE rectors SET position = position - 1
                        WHERE position > $1 AND position <= $2`,
						[currentPos, targetPos],
					);
				} else {
					await client.query(
						`UPDATE rectors SET position = position + 1
                        WHERE position >= $1 AND position < $2`,
						[targetPos, currentPos],
					);
				}

				await client.query('UPDATE rectors SET position = $1 WHERE id = $2', [
					targetPos,
					id,
				]);
			}

			const updated = await client.query<RectorRow>(
				`UPDATE rectors SET
                    name        = COALESCE($1, name),
                    years       = COALESCE($2, years),
                    description = COALESCE($3, description),
                    full_text   = COALESCE($4, full_text),
                    img         = COALESCE($5, img),
                    images      = COALESCE($6, images),
                    files       = COALESCE($7, files)
                WHERE id = $8
                RETURNING *`,
				[
					name ?? null,
					years ?? null,
					description ?? null,
					full_text ?? null,
					img ?? null,
					cleanImages ?? null,
					cleanFiles !== undefined ? JSON.stringify(cleanFiles) : null,
					id,
				],
			);

			await client.query('COMMIT');
			return updated.rows[0] ?? null;
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	}

	// Удалить ректора по id и сдвинуть позиции
	async delete(id: number): Promise<boolean> {
		const client = await this.db.connect();
		try {
			await client.query('BEGIN');

			const result = await client.query<RectorRow>(
				'DELETE FROM rectors WHERE id = $1 RETURNING *',
				[id],
			);
			if (result.rows.length === 0) {
				await client.query('ROLLBACK');
				return false;
			}

			const deletedPos: number = result.rows[0].position;
			await client.query('UPDATE rectors SET position = position - 1 WHERE position > $1', [
				deletedPos,
			]);

			await client.query('COMMIT');
			return true;
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
	}
}

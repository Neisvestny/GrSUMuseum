import type { Prisma, PrismaClient } from '../generated/prisma/client.js';
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

function extractYear(years: string): number {
	const match = years.match(/\d{4}/);
	return match ? Number(match[0]) : 0;
}

function rowToRector(r: {
	id: number;
	position: number;
	name: string;
	years: string;
	description: string;
	full_text: string;
	img: string;
	images: string[];
	files: Prisma.JsonValue;
}): RectorRow {
	return {
		id: r.id,
		position: r.position,
		name: r.name,
		years: r.years,
		description: r.description,
		full_text: r.full_text,
		img: r.img,
		images: r.images,
		files: Array.isArray(r.files)
			? (r.files as RectorRow['files'])
			: typeof r.files === 'string'
				? (JSON.parse(r.files) as RectorRow['files'])
				: [],
	};
}

export class RectorsService {
	constructor(private prisma: PrismaClient) {}

	async getAll(): Promise<RectorRow[]> {
		const rows = await this.prisma.rectors.findMany({ orderBy: { position: 'asc' } });
		return rows.map(rowToRector);
	}

	async getById(id: number): Promise<RectorRow | null> {
		const row = await this.prisma.rectors.findUnique({ where: { id } });
		return row ? rowToRector(row) : null;
	}

	async create(data: RectorInput): Promise<RectorRow> {
		const {
			name = '',
			years = '',
			description = '',
			full_text = '',
			img = '',
			images = [],
			files = [],
		} = data;

		const cleanImages = images.filter((s) => s.trim() !== '');
		const cleanFiles = files.filter((f) => f.name.trim() !== '' || f.url.trim() !== '');

		const newYear = extractYear(years);

		return this.prisma.$transaction(async (tx) => {
			const posRes = await tx.$queryRaw<{ pos: number }[]>`
				SELECT position AS pos
				FROM rectors
				WHERE CAST(SPLIT_PART(years, '—', 1) AS INTEGER) > ${newYear}
				ORDER BY position ASC
				LIMIT 1
			`;

			let insertPos: number;
			if (posRes.length > 0) {
				insertPos = posRes[0].pos;
			} else {
				const count = await tx.rectors.count();
				insertPos = count + 1;
			}

			await tx.$executeRaw`
				UPDATE rectors SET position = position + 100000 WHERE position >= ${insertPos}
			`;
			await tx.$executeRaw`
				UPDATE rectors SET position = position - 99999 WHERE position >= ${insertPos} + 100000
			`;

			const row = await tx.rectors.create({
				data: {
					position: insertPos,
					name,
					years,
					description,
					full_text,
					img,
					images: cleanImages,
					files: cleanFiles as Prisma.InputJsonValue,
				},
			});

			return rowToRector(row);
		});
	}

	async update(id: number, data: RectorInput): Promise<RectorRow | null> {
		const { name, years, description, full_text, img, images, files, position } = data;

		const cleanImages = images?.filter((s) => s.trim() !== '');
		const cleanFiles = files?.filter((f) => f.name.trim() !== '' || f.url.trim() !== '');

		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.rectors.findUnique({ where: { id } });
			if (!existing) return null;

			if (position !== undefined && Number(position) !== existing.position) {
				const count = await tx.rectors.count();
				const targetPos = Math.max(1, Math.min(Number(position), count));
				const currentPos = existing.position;

				await tx.rectors.update({ where: { id }, data: { position: 0 } });

				if (targetPos > currentPos) {
					await tx.$executeRaw`
						UPDATE rectors SET position = position - 1
						WHERE position > ${currentPos} AND position <= ${targetPos}
					`;
				} else {
					await tx.$executeRaw`
						UPDATE rectors SET position = position + 1
						WHERE position >= ${targetPos} AND position < ${currentPos}
					`;
				}

				await tx.rectors.update({
					where: { id },
					data: { position: targetPos },
				});
			}

			const updated = await tx.rectors.update({
				where: { id },
				data: {
					name: name ?? undefined,
					years: years ?? undefined,
					description: description ?? undefined,
					full_text: full_text ?? undefined,
					img: img ?? undefined,
					images: cleanImages ?? undefined,
					files:
						cleanFiles !== undefined
							? (cleanFiles as Prisma.InputJsonValue)
							: undefined,
				},
			});

			return rowToRector(updated);
		});
	}

	async delete(id: number): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const row = await tx.rectors.findUnique({ where: { id } });
			if (!row) return false;

			await tx.rectors.delete({ where: { id } });
			await tx.$executeRaw`
				UPDATE rectors SET position = position - 1 WHERE position > ${row.position}
			`;
			return true;
		});
	}
}

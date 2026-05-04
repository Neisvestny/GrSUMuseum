import type { PrismaClient } from '../generated/prisma/client.js';
import type { Section, TeacherRow } from '../types';

export class TeachersService {
	constructor(private prisma: PrismaClient) {}

	async getAll(section: Section): Promise<TeacherRow[]> {
		const rows = await this.prisma.teachers.findMany({
			where: { section },
			orderBy: { position: 'asc' },
		});
		return rows.map((r) => ({
			id: r.position,
			name: r.name,
			role: r.role,
			desc: r.description,
			img: r.img,
		}));
	}

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

		return this.prisma.$transaction(async (tx) => {
			const count = await tx.teachers.count({ where: { section } });
			const insertPos =
				position !== undefined
					? Math.max(1, Math.min(Number(position), count + 1))
					: count + 1;

			await tx.teachers.updateMany({
				where: { section, position: { gte: insertPos } },
				data: { position: { increment: 1 } },
			});

			const row = await tx.teachers.create({
				data: {
					section,
					position: insertPos,
					name,
					role,
					description: desc,
					img,
				},
			});

			return {
				id: row.position,
				name: row.name,
				role: row.role,
				desc: row.description,
				img: row.img,
			};
		});
	}

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

		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.teachers.findUnique({
				where: { section_position: { section, position: currentPos } },
			});
			if (!existing) return null;

			let resultPos = currentPos;

			if (newPos !== undefined && Number(newPos) !== currentPos) {
				const count = await tx.teachers.count({ where: { section } });
				const targetPos = Math.max(1, Math.min(Number(newPos), count));
				resultPos = targetPos;

				await tx.teachers.update({
					where: { section_position: { section, position: currentPos } },
					data: { position: 0 },
				});

				if (targetPos > currentPos) {
					await tx.teachers.updateMany({
						where: {
							section,
							position: { gt: currentPos, lte: targetPos },
						},
						data: { position: { decrement: 1 } },
					});
				} else {
					await tx.teachers.updateMany({
						where: {
							section,
							position: { gte: targetPos, lt: currentPos },
						},
						data: { position: { increment: 1 } },
					});
				}

				await tx.teachers.update({
					where: { section_position: { section, position: 0 } },
					data: {
						position: targetPos,
						name: name ?? undefined,
						role: role ?? undefined,
						description: desc ?? undefined,
						img: img ?? undefined,
					},
				});
			} else {
				await tx.teachers.update({
					where: { section_position: { section, position: currentPos } },
					data: {
						name: name ?? undefined,
						role: role ?? undefined,
						description: desc ?? undefined,
						img: img ?? undefined,
					},
				});
			}

			const updated = await tx.teachers.findUnique({
				where: { section_position: { section, position: resultPos } },
			});
			if (!updated) return null;
			return {
				id: updated.position,
				name: updated.name,
				role: updated.role,
				desc: updated.description,
				img: updated.img,
			};
		});
	}

	async delete(section: Section, pos: number): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const deleted = await tx.teachers.deleteMany({
				where: { section, position: pos },
			});
			if (deleted.count === 0) return false;

			await tx.teachers.updateMany({
				where: { section, position: { gt: pos } },
				data: { position: { decrement: 1 } },
			});
			return true;
		});
	}

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

		await this.prisma.$transaction(async (tx) => {
			await tx.teachers.deleteMany({ where: { section } });
			for (const t of defaults) {
				await tx.teachers.create({
					data: {
						section,
						position: t.position,
						name: t.name,
						role: t.role,
						description: t.desc,
						img: t.img,
					},
				});
			}
		});

		return this.getAll(section);
	}
}

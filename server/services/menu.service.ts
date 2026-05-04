import type { menu_items, PrismaClient } from '../generated/prisma/client.js';
import { HttpError } from '../shared/errors';
import type { MenuItemRow } from '../types';

interface MenuItemInput {
	section?: string;
	label?: string;
	path?: string;
	is_active?: boolean;
	position?: number;
}

export class MenuService {
	constructor(private prisma: PrismaClient) {}

	async listBySection(section: string, includeInactive = false): Promise<MenuItemRow[]> {
		const rows = await this.prisma.menu_items.findMany({
			where: {
				section,
				...(includeInactive ? {} : { is_active: true }),
			},
			orderBy: { position: 'asc' },
		});
		return rows.map(this.toRow);
	}

	async listAll(): Promise<MenuItemRow[]> {
		const rows = await this.prisma.menu_items.findMany({
			orderBy: [{ section: 'asc' }, { position: 'asc' }],
		});
		return rows.map(this.toRow);
	}

	async create(data: MenuItemInput): Promise<MenuItemRow> {
		const section = (data.section ?? '').trim();
		const label = (data.label ?? '').trim();
		if (!section) throw new HttpError(400, 'section обязателен');
		if (!label) throw new HttpError(400, 'label обязателен');

		return this.prisma.$transaction(async (tx) => {
			const count = await tx.menu_items.count({ where: { section } });
			const insertPos =
				data.position !== undefined
					? Math.max(1, Math.min(Number(data.position), count + 1))
					: count + 1;

			await tx.menu_items.updateMany({
				where: { section, position: { gte: insertPos } },
				data: { position: { increment: 1 } },
			});

			const row = await tx.menu_items.create({
				data: {
					section,
					position: insertPos,
					label,
					path: data.path ?? '',
					is_active: data.is_active ?? true,
				},
			});
			return this.toRow(row);
		});
	}

	async update(id: number, data: MenuItemInput): Promise<MenuItemRow | null> {
		return this.prisma.$transaction(async (tx) => {
			const current = await tx.menu_items.findUnique({ where: { id } });
			if (!current) return null;

			if (data.section !== undefined && data.section !== current.section) {
				throw new HttpError(400, 'Перенос пункта меню между секциями не поддерживается');
			}

			if (data.position !== undefined && Number(data.position) !== current.position) {
				const count = await tx.menu_items.count({ where: { section: current.section } });
				const targetPos = Math.max(1, Math.min(Number(data.position), count));

				await tx.menu_items.update({ where: { id }, data: { position: 0 } });
				if (targetPos > current.position) {
					await tx.menu_items.updateMany({
						where: {
							section: current.section,
							position: { gt: current.position, lte: targetPos },
						},
						data: { position: { decrement: 1 } },
					});
				} else {
					await tx.menu_items.updateMany({
						where: {
							section: current.section,
							position: { gte: targetPos, lt: current.position },
						},
						data: { position: { increment: 1 } },
					});
				}
				await tx.menu_items.update({ where: { id }, data: { position: targetPos } });
			}

			await tx.menu_items.update({
				where: { id },
				data: {
					label: data.label ?? undefined,
					path: data.path ?? undefined,
					is_active: data.is_active ?? undefined,
				},
			});

			const fresh = await tx.menu_items.findUnique({ where: { id } });
			return fresh ? this.toRow(fresh) : null;
		});
	}

	async delete(id: number): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.menu_items.findUnique({
				where: { id },
				select: { id: true, section: true, position: true },
			});
			if (!existing) return false;

			await tx.menu_items.delete({ where: { id } });
			await tx.menu_items.updateMany({
				where: { section: existing.section, position: { gt: existing.position } },
				data: { position: { decrement: 1 } },
			});
			return true;
		});
	}

	private toRow(r: menu_items): MenuItemRow {
		return {
			id: r.id,
			section: r.section,
			position: r.position,
			label: r.label,
			path: r.path,
			is_active: r.is_active,
		};
	}
}

import type { MenuItem, PrismaClient } from '../generated/prisma/client.js';
import { HttpError } from '../shared/errors.js';
import type { MenuItemRow } from '../types/index.js';

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
		const rows = await this.prisma.menuItem.findMany({
			where: {
				section,
				parentId: null,
				...(includeInactive ? {} : { isActive: true }),
			},
			orderBy: { position: 'asc' },
		});
		return rows.map((r) => this.toRow(r));
	}

	async listAll(): Promise<MenuItemRow[]> {
		const rows = await this.prisma.menuItem.findMany({
			orderBy: [{ section: 'asc' }, { position: 'asc' }],
		});
		return rows.map((r) => this.toRow(r));
	}

	async create(data: MenuItemInput): Promise<MenuItemRow> {
		const section = (data.section ?? '').trim();
		const label = (data.label ?? '').trim();
		const path = (data.path ?? '').trim();
		if (!section) throw new HttpError(400, 'section обязателен');
		if (!label) throw new HttpError(400, 'label обязателен');
		if (!path) throw new HttpError(400, 'path обязателен');

		return this.prisma.$transaction(async (tx) => {
			const count = await tx.menuItem.count({ where: { section, parentId: null } });
			const insertPos =
				data.position !== undefined
					? Math.max(0, Math.min(Number(data.position), count))
					: count;

			await tx.menuItem.updateMany({
				where: { section, parentId: null, position: { gte: insertPos } },
				data: { position: { increment: 1 } },
			});

			const row = await tx.menuItem.create({
				data: {
					section,
					position: insertPos,
					label,
					path,
					isActive: data.is_active ?? true,
				},
			});
			return this.toRow(row);
		});
	}

	async update(id: number, data: MenuItemInput): Promise<MenuItemRow | null> {
		return this.prisma.$transaction(async (tx) => {
			const current = await tx.menuItem.findUnique({ where: { id } });
			if (!current) return null;

			if (data.section !== undefined && data.section !== current.section) {
				throw new HttpError(400, 'Перенос пункта меню между секциями не поддерживается');
			}

			if (data.position !== undefined && Number(data.position) !== current.position) {
				const count = await tx.menuItem.count({
					where: { section: current.section, parentId: current.parentId },
				});
				const targetPos = Math.max(0, Math.min(Number(data.position), count - 1));

				await tx.menuItem.update({ where: { id }, data: { position: -1 } });
				if (targetPos > current.position) {
					await tx.menuItem.updateMany({
						where: {
							section: current.section,
							parentId: current.parentId,
							position: { gt: current.position, lte: targetPos },
						},
						data: { position: { decrement: 1 } },
					});
				} else {
					await tx.menuItem.updateMany({
						where: {
							section: current.section,
							parentId: current.parentId,
							position: { gte: targetPos, lt: current.position },
						},
						data: { position: { increment: 1 } },
					});
				}
				await tx.menuItem.update({ where: { id }, data: { position: targetPos } });
			}

			await tx.menuItem.update({
				where: { id },
				data: {
					label: data.label ?? undefined,
					path: data.path?.trim() || undefined,
					isActive: data.is_active ?? undefined,
				},
			});

			const fresh = await tx.menuItem.findUnique({ where: { id } });
			return fresh ? this.toRow(fresh) : null;
		});
	}

	async delete(id: number): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.menuItem.findUnique({
				where: { id },
				select: { id: true, section: true, position: true, parentId: true },
			});
			if (!existing) return false;

			await tx.menuItem.delete({ where: { id } });
			await tx.menuItem.updateMany({
				where: {
					section: existing.section,
					parentId: existing.parentId,
					position: { gt: existing.position },
				},
				data: { position: { decrement: 1 } },
			});
			return true;
		});
	}

	private toRow(r: MenuItem): MenuItemRow {
		return {
			id: r.id,
			parentId: r.parentId,
			section: r.section,
			position: r.position,
			label: r.label,
			path: r.path,
			is_active: r.isActive,
		};
	}
}

import type { Prisma, PrismaClient } from '../generated/prisma/client.js';
import { HttpError } from '../shared/errors';
import type {
	BlockDto,
	PageBlockRow,
	PageDto,
	PageParagraphRow,
	PageRow,
	PageTabRow,
	PageTemplate,
} from '../types';

interface PageInput {
	slug?: string;
	title?: string;
	template?: PageTemplate;
}

interface TabInput {
	label?: string;
	position?: number;
}

interface BlockInput {
	page_id?: number | null;
	tab_id?: number | null;
	img?: string | null;
	position?: number;
}

interface ParagraphInput {
	text?: string;
	position?: number;
}

function toPageRow(row: { id: number; slug: string; title: string; template: string }): PageRow {
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		template: row.template as PageTemplate,
	};
}

export class PagesService {
	constructor(private prisma: PrismaClient) {}

	private normalizePath(raw: string): string {
		return raw
			.trim()
			.replace(/^\/+|\/+$/g, '')
			.replace(/\/{2,}/g, '/');
	}

	async listPages(): Promise<PageRow[]> {
		const rows = await this.prisma.pages.findMany({
			orderBy: { id: 'asc' },
			select: { id: true, slug: true, title: true, template: true },
		});
		return rows.map(toPageRow);
	}

	async getPageBySlug(slug: string): Promise<PageDto | null> {
		const page = await this.prisma.pages.findUnique({
			where: { slug: this.normalizePath(slug) },
			select: { id: true, slug: true, title: true, template: true },
		});
		if (!page) return null;
		return this.assemblePage(toPageRow(page));
	}

	async getPageByPath(path: string): Promise<PageDto | null> {
		const normalized = this.normalizePath(path);
		if (!normalized) return null;
		const page = await this.prisma.pages.findUnique({
			where: { slug: normalized },
			select: { id: true, slug: true, title: true, template: true },
		});
		if (!page) return null;
		return this.assemblePage(toPageRow(page));
	}

	async getPageById(id: number): Promise<PageDto | null> {
		const page = await this.prisma.pages.findUnique({
			where: { id },
			select: { id: true, slug: true, title: true, template: true },
		});
		if (!page) return null;
		return this.assemblePage(toPageRow(page));
	}

	private async assemblePage(page: PageRow): Promise<PageDto> {
		const [tabsRes, blocksRes] = await Promise.all([
			this.prisma.page_tabs.findMany({
				where: { page_id: page.id },
				orderBy: { position: 'asc' },
				select: { id: true, page_id: true, position: true, label: true },
			}),
			this.prisma.page_blocks.findMany({
				where: {
					OR: [{ page_id: page.id }, { page_tabs: { page_id: page.id } }],
				},
				orderBy: { position: 'asc' },
				select: {
					id: true,
					page_id: true,
					tab_id: true,
					position: true,
					img: true,
				},
			}),
		]);

		const blockIds = blocksRes.map((b) => b.id);
		const paragraphsRes =
			blockIds.length > 0
				? await this.prisma.page_paragraphs.findMany({
						where: { block_id: { in: blockIds } },
						orderBy: { position: 'asc' },
						select: { id: true, block_id: true, position: true, text: true },
					})
				: [];

		const paragraphsByBlock = new Map<number, PageParagraphRow[]>();
		for (const p of paragraphsRes) {
			const list = paragraphsByBlock.get(p.block_id) ?? [];
			list.push(p);
			paragraphsByBlock.set(p.block_id, list);
		}

		const blockToDto = (b: PageBlockRow): BlockDto => ({
			id: b.id,
			position: b.position,
			img: b.img,
			paragraphs: (paragraphsByBlock.get(b.id) ?? []).map((p) => ({
				id: p.id,
				position: p.position,
				text: p.text,
			})),
		});

		const tabsDto = tabsRes.map((t) => ({
			id: t.id,
			position: t.position,
			label: t.label,
			blocks: blocksRes.filter((b) => b.tab_id === t.id).map(blockToDto),
		}));

		const directBlocks = blocksRes.filter((b) => b.page_id === page.id).map(blockToDto);

		return {
			id: page.id,
			slug: page.slug,
			title: page.title,
			template: page.template as PageTemplate,
			tabs: tabsDto,
			blocks: directBlocks,
		};
	}

	async createPage(data: PageInput): Promise<PageRow> {
		const slug = this.normalizePath(data.slug ?? '');
		const title = (data.title ?? '').trim();
		if (!slug) throw new HttpError(400, 'slug обязателен');
		if (!title) throw new HttpError(400, 'title обязателен');

		try {
			const row = await this.prisma.pages.create({
				data: {
					slug,
					title,
					template: data.template ?? 'tabs_alternating',
				},
				select: { id: true, slug: true, title: true, template: true },
			});
			return toPageRow(row);
		} catch (err) {
			if (isUniqueViolation(err)) {
				throw new HttpError(409, `Страница со slug "${slug}" уже существует`);
			}
			if (isTemplateConstraintViolation(err)) {
				throw new HttpError(400, 'Некорректный template для страницы');
			}
			throw err;
		}
	}

	async updatePage(id: number, data: PageInput): Promise<PageRow | null> {
		const normalizedSlug = data.slug === undefined ? undefined : this.normalizePath(data.slug);
		try {
			const row = await this.prisma.pages.update({
				where: { id },
				data: {
					slug: normalizedSlug,
					title: data.title ?? undefined,
					template: data.template ?? undefined,
				},
				select: { id: true, slug: true, title: true, template: true },
			});
			return toPageRow(row);
		} catch (err) {
			if (isRecordNotFound(err)) return null;
			if (isUniqueViolation(err)) {
				throw new HttpError(409, `Страница со slug "${normalizedSlug}" уже существует`);
			}
			if (isTemplateConstraintViolation(err)) {
				throw new HttpError(400, 'Некорректный template для страницы');
			}
			throw err;
		}
	}

	async deletePage(id: number): Promise<boolean> {
		try {
			await this.prisma.pages.delete({ where: { id } });
			return true;
		} catch (err) {
			if (isRecordNotFound(err)) return false;
			throw err;
		}
	}

	async listTabs(pageId: number): Promise<PageTabRow[]> {
		return this.prisma.page_tabs.findMany({
			where: { page_id: pageId },
			orderBy: { position: 'asc' },
			select: { id: true, page_id: true, position: true, label: true },
		});
	}

	async createTab(pageId: number, data: TabInput): Promise<PageTabRow> {
		const label = (data.label ?? 'Новая вкладка').trim();
		return this.prisma.$transaction(async (tx) => {
			await assertPageExists(tx, pageId);

			const insertPos = await resolveInsertPosition(
				tx,
				'page_tabs',
				'page_id',
				pageId,
				data.position,
			);

			await tx.page_tabs.updateMany({
				where: { page_id: pageId, position: { gte: insertPos } },
				data: { position: { increment: 1 } },
			});

			return tx.page_tabs.create({
				data: { page_id: pageId, position: insertPos, label },
				select: { id: true, page_id: true, position: true, label: true },
			});
		});
	}

	async updateTab(tabId: number, data: TabInput): Promise<PageTabRow | null> {
		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.page_tabs.findUnique({
				where: { id: tabId },
				select: { id: true, page_id: true, position: true, label: true },
			});
			if (!existing) return null;

			if (data.position !== undefined && Number(data.position) !== existing.position) {
				await reorderWithinParent(
					tx,
					'page_tabs',
					'page_id',
					existing.page_id,
					tabId,
					existing.position,
					Number(data.position),
				);
			}

			if (data.label !== undefined) {
				await tx.page_tabs.update({
					where: { id: tabId },
					data: { label: data.label },
				});
			}

			return tx.page_tabs.findUniqueOrThrow({
				where: { id: tabId },
				select: { id: true, page_id: true, position: true, label: true },
			});
		});
	}

	async deleteTab(tabId: number): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.page_tabs.findUnique({
				where: { id: tabId },
				select: { page_id: true, position: true },
			});
			if (!existing) return false;

			await tx.page_tabs.delete({ where: { id: tabId } });
			await tx.page_tabs.updateMany({
				where: { page_id: existing.page_id, position: { gt: existing.position } },
				data: { position: { decrement: 1 } },
			});
			return true;
		});
	}

	async createBlock(data: BlockInput): Promise<PageBlockRow> {
		const pageId = normalizeId(data.page_id);
		const tabId = normalizeId(data.tab_id);
		assertExactlyOneParent(pageId, tabId);

		return this.prisma.$transaction(async (tx) => {
			if (pageId !== null) {
				await assertPageExists(tx, pageId);
				const insertPos = await resolveInsertPosition(
					tx,
					'page_blocks',
					'page_id',
					pageId,
					data.position,
				);
				await tx.page_blocks.updateMany({
					where: { page_id: pageId, position: { gte: insertPos } },
					data: { position: { increment: 1 } },
				});
				return tx.page_blocks.create({
					data: {
						page_id: pageId,
						tab_id: null,
						position: insertPos,
						img: data.img ?? null,
					},
					select: { id: true, page_id: true, tab_id: true, position: true, img: true },
				});
			}

			await assertTabExists(tx, tabId!);
			const insertPos = await resolveInsertPosition(
				tx,
				'page_blocks',
				'tab_id',
				tabId!,
				data.position,
			);
			await tx.page_blocks.updateMany({
				where: { tab_id: tabId!, position: { gte: insertPos } },
				data: { position: { increment: 1 } },
			});
			return tx.page_blocks.create({
				data: {
					page_id: null,
					tab_id: tabId!,
					position: insertPos,
					img: data.img ?? null,
				},
				select: { id: true, page_id: true, tab_id: true, position: true, img: true },
			});
		});
	}

	async updateBlock(blockId: number, data: BlockInput): Promise<PageBlockRow | null> {
		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.page_blocks.findUnique({
				where: { id: blockId },
				select: { id: true, page_id: true, tab_id: true, position: true, img: true },
			});
			if (!existing) return null;

			if (data.page_id !== undefined || data.tab_id !== undefined) {
				const newPageId = normalizeId(data.page_id);
				const newTabId = normalizeId(data.tab_id);
				if (newPageId !== existing.page_id || newTabId !== existing.tab_id) {
					throw new HttpError(
						400,
						'Перенос блока между страницей и вкладкой пока не поддерживается',
					);
				}
			}

			if (data.position !== undefined && Number(data.position) !== existing.position) {
				if (existing.page_id !== null) {
					await reorderWithinParent(
						tx,
						'page_blocks',
						'page_id',
						existing.page_id,
						blockId,
						existing.position,
						Number(data.position),
					);
				} else if (existing.tab_id !== null) {
					await reorderWithinParent(
						tx,
						'page_blocks',
						'tab_id',
						existing.tab_id,
						blockId,
						existing.position,
						Number(data.position),
					);
				}
			}

			if (data.img !== undefined) {
				await tx.page_blocks.update({
					where: { id: blockId },
					data: { img: data.img },
				});
			}

			return tx.page_blocks.findUniqueOrThrow({
				where: { id: blockId },
				select: { id: true, page_id: true, tab_id: true, position: true, img: true },
			});
		});
	}

	async deleteBlock(blockId: number): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.page_blocks.findUnique({
				where: { id: blockId },
				select: { page_id: true, tab_id: true, position: true },
			});
			if (!existing) return false;

			await tx.page_blocks.delete({ where: { id: blockId } });
			if (existing.page_id !== null) {
				await tx.page_blocks.updateMany({
					where: { page_id: existing.page_id, position: { gt: existing.position } },
					data: { position: { decrement: 1 } },
				});
			} else if (existing.tab_id !== null) {
				await tx.page_blocks.updateMany({
					where: { tab_id: existing.tab_id, position: { gt: existing.position } },
					data: { position: { decrement: 1 } },
				});
			}
			return true;
		});
	}

	async createParagraph(blockId: number, data: ParagraphInput): Promise<PageParagraphRow> {
		const text = data.text ?? '';
		return this.prisma.$transaction(async (tx) => {
			await assertBlockExists(tx, blockId);
			const insertPos = await resolveInsertPosition(
				tx,
				'page_paragraphs',
				'block_id',
				blockId,
				data.position,
			);
			await tx.page_paragraphs.updateMany({
				where: { block_id: blockId, position: { gte: insertPos } },
				data: { position: { increment: 1 } },
			});
			return tx.page_paragraphs.create({
				data: { block_id: blockId, position: insertPos, text },
				select: { id: true, block_id: true, position: true, text: true },
			});
		});
	}

	async updateParagraph(
		paragraphId: number,
		data: ParagraphInput,
	): Promise<PageParagraphRow | null> {
		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.page_paragraphs.findUnique({
				where: { id: paragraphId },
				select: { id: true, block_id: true, position: true, text: true },
			});
			if (!existing) return null;

			if (data.position !== undefined && Number(data.position) !== existing.position) {
				await reorderWithinParent(
					tx,
					'page_paragraphs',
					'block_id',
					existing.block_id,
					paragraphId,
					existing.position,
					Number(data.position),
				);
			}

			if (data.text !== undefined) {
				await tx.page_paragraphs.update({
					where: { id: paragraphId },
					data: { text: data.text },
				});
			}

			return tx.page_paragraphs.findUniqueOrThrow({
				where: { id: paragraphId },
				select: { id: true, block_id: true, position: true, text: true },
			});
		});
	}

	async deleteParagraph(paragraphId: number): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const existing = await tx.page_paragraphs.findUnique({
				where: { id: paragraphId },
				select: { block_id: true, position: true },
			});
			if (!existing) return false;

			await tx.page_paragraphs.delete({ where: { id: paragraphId } });
			await tx.page_paragraphs.updateMany({
				where: { block_id: existing.block_id, position: { gt: existing.position } },
				data: { position: { decrement: 1 } },
			});
			return true;
		});
	}
}

function isUniqueViolation(err: unknown): boolean {
	const code =
		typeof err === 'object' && err !== null && 'code' in err
			? (err as { code?: unknown }).code
			: undefined;
	return code === 'P2002' || code === '23505';
}

function isTemplateConstraintViolation(err: unknown): boolean {
	if (typeof err !== 'object' || err === null) return false;
	if (
		'constraint' in err &&
		(err as { constraint?: unknown }).constraint === 'pages_template_check'
	)
		return true;
	const code = 'code' in err ? (err as { code?: unknown }).code : undefined;
	return code === '23514' && String(err).includes('pages_template_check');
}

function isRecordNotFound(err: unknown): boolean {
	return (
		typeof err === 'object' &&
		err !== null &&
		'code' in err &&
		(err as { code?: unknown }).code === 'P2025'
	);
}

function normalizeId(value: number | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

function assertExactlyOneParent(pageId: number | null, tabId: number | null): void {
	if ((pageId === null) === (tabId === null)) {
		throw new HttpError(400, 'Блок должен быть привязан либо к странице, либо к вкладке');
	}
}

async function assertPageExists(tx: Prisma.TransactionClient, pageId: number): Promise<void> {
	const n = await tx.pages.count({ where: { id: pageId } });
	if (n === 0) throw new HttpError(404, 'Страница не найдена');
}

async function assertTabExists(tx: Prisma.TransactionClient, tabId: number): Promise<void> {
	const n = await tx.page_tabs.count({ where: { id: tabId } });
	if (n === 0) throw new HttpError(404, 'Вкладка не найдена');
}

async function assertBlockExists(tx: Prisma.TransactionClient, blockId: number): Promise<void> {
	const n = await tx.page_blocks.count({ where: { id: blockId } });
	if (n === 0) throw new HttpError(404, 'Блок не найден');
}

async function resolveInsertPosition(
	tx: Prisma.TransactionClient,
	table: 'page_tabs' | 'page_blocks' | 'page_paragraphs',
	parentColumn: 'page_id' | 'tab_id' | 'block_id',
	parentId: number,
	position: number | undefined,
): Promise<number> {
	let count = 0;
	if (table === 'page_tabs') {
		count = await tx.page_tabs.count({ where: { page_id: parentId } });
	} else if (table === 'page_blocks') {
		count =
			parentColumn === 'page_id'
				? await tx.page_blocks.count({ where: { page_id: parentId } })
				: await tx.page_blocks.count({ where: { tab_id: parentId } });
	} else {
		count = await tx.page_paragraphs.count({ where: { block_id: parentId } });
	}
	if (position === undefined) return count + 1;
	const n = Number(position);
	return Math.max(1, Math.min(Number.isFinite(n) ? n : count + 1, count + 1));
}

const REORDER_KEYS = new Set([
	'page_tabs:page_id',
	'page_blocks:page_id',
	'page_blocks:tab_id',
	'page_paragraphs:block_id',
]);

async function reorderWithinParent(
	tx: Prisma.TransactionClient,
	table: 'page_tabs' | 'page_blocks' | 'page_paragraphs',
	parentColumn: 'page_id' | 'tab_id' | 'block_id',
	parentId: number,
	rowId: number,
	currentPos: number,
	rawTargetPos: number,
): Promise<void> {
	if (!REORDER_KEYS.has(`${table}:${parentColumn}`)) {
		throw new Error('Invalid reorder table/parent combination');
	}

	let count = 0;
	if (table === 'page_tabs') {
		count = await tx.page_tabs.count({ where: { page_id: parentId } });
	} else if (table === 'page_blocks') {
		count =
			parentColumn === 'page_id'
				? await tx.page_blocks.count({ where: { page_id: parentId } })
				: await tx.page_blocks.count({ where: { tab_id: parentId } });
	} else {
		count = await tx.page_paragraphs.count({ where: { block_id: parentId } });
	}

	const targetPos = Math.max(1, Math.min(rawTargetPos, count));
	if (targetPos === currentPos) return;

	await tx.$executeRawUnsafe(`UPDATE ${table} SET position = 0 WHERE id = $1`, rowId);

	if (targetPos > currentPos) {
		await tx.$executeRawUnsafe(
			`UPDATE ${table} SET position = position - 1 WHERE ${parentColumn} = $1 AND position > $2 AND position <= $3`,
			parentId,
			currentPos,
			targetPos,
		);
	} else {
		await tx.$executeRawUnsafe(
			`UPDATE ${table} SET position = position + 1 WHERE ${parentColumn} = $1 AND position >= $2 AND position < $3`,
			parentId,
			targetPos,
			currentPos,
		);
	}

	await tx.$executeRawUnsafe(`UPDATE ${table} SET position = $1 WHERE id = $2`, targetPos, rowId);
}

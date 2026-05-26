import type { Prisma, PrismaClient } from '../generated/prisma/client.js';
import { StatusCodes } from 'http-status-codes';
import { EMPTY_DOCUMENT, isPageDocument, parsePageDocument, type PageDocument } from '../domain/document.js';
import { ApiMessage } from '../shared/api-messages.js';
import { HttpError } from '../shared/errors.js';

export interface PageSummaryDto {
	id: number;
	slug: string;
	title: string;
	themeKey: string;
	sidebarEnabled: boolean;
	hasPublished: boolean;
	documentVersion: number;
}

export interface PublicPageDto {
	id: number;
	slug: string;
	title: string;
	themeKey: string;
	sidebarEnabled: boolean;
	document: PageDocument;
}

export interface DraftPageDto extends PublicPageDto {
	documentVersion: number;
	draftDocument: PageDocument;
	publishedDocument: PageDocument | null;
}

export interface PageVersionDto {
	id: number;
	pageId: number;
	createdAt: string;
	createdBy: string | null;
}

export interface PageVersionDetailDto extends PageVersionDto {
	document: PageDocument;
}

interface CreatePageInput {
	slug?: string;
	title?: string;
	themeKey?: string;
	sidebarEnabled?: boolean;
}

interface UpdatePageMetaInput {
	title?: string;
	themeKey?: string;
	sidebarEnabled?: boolean;
	slug?: string;
}

export class PagesService {
	constructor(private prisma: PrismaClient) {}

	private normalizeSlug(raw: string): string {
		return raw
			.trim()
			.replace(/^\/+|\/+$/g, '')
			.replace(/\/{2,}/g, '/');
	}

	private async resolveSlug(slug: string): Promise<string> {
		const normalized = this.normalizeSlug(slug);
		if (!normalized) return normalized;

		const redirect = await this.prisma.pageRedirect.findUnique({
			where: { fromSlug: normalized },
		});
		if (redirect) return redirect.toSlug;

		return normalized;
	}

	async listPages(): Promise<PageSummaryDto[]> {
		const rows = await this.prisma.page.findMany({
			where: { deletedAt: null },
			orderBy: { id: 'asc' },
			select: {
				id: true,
				slug: true,
				title: true,
				themeKey: true,
				sidebarEnabled: true,
				publishedDocument: true,
				documentVersion: true,
			},
		});
		return rows.map((r) => ({
			id: r.id,
			slug: r.slug,
			title: r.title,
			themeKey: r.themeKey,
			sidebarEnabled: r.sidebarEnabled,
			hasPublished: r.publishedDocument !== null,
			documentVersion: r.documentVersion,
		}));
	}

	async getPublishedBySlug(slug: string): Promise<PublicPageDto | null> {
		const resolved = await this.resolveSlug(slug);
		const row = await this.prisma.page.findFirst({
			where: { slug: resolved, deletedAt: null },
		});
		if (!row || row.publishedDocument === null) return null;

		return {
			id: row.id,
			slug: row.slug,
			title: row.title,
			themeKey: row.themeKey,
			sidebarEnabled: row.sidebarEnabled,
			document: parsePageDocument(row.publishedDocument),
		};
	}

	/** @deprecated use getPublishedBySlug */
	async getPageByPath(path: string): Promise<PublicPageDto | null> {
		return this.getPublishedBySlug(path);
	}

	async getDraftBySlug(slug: string): Promise<DraftPageDto | null> {
		const resolved = await this.resolveSlug(slug);
		const row = await this.prisma.page.findFirst({
			where: { slug: resolved, deletedAt: null },
		});
		if (!row) return null;

		const draft = parsePageDocument(row.draftDocument);
		const published =
			row.publishedDocument !== null ? parsePageDocument(row.publishedDocument) : null;

		return {
			id: row.id,
			slug: row.slug,
			title: row.title,
			themeKey: row.themeKey,
			sidebarEnabled: row.sidebarEnabled,
			document: draft,
			documentVersion: row.documentVersion,
			draftDocument: draft,
			publishedDocument: published,
		};
	}

	async getPageById(id: number): Promise<DraftPageDto | null> {
		const row = await this.prisma.page.findFirst({
			where: { id, deletedAt: null },
		});
		if (!row) return null;

		const draft = parsePageDocument(row.draftDocument);
		const published =
			row.publishedDocument !== null ? parsePageDocument(row.publishedDocument) : null;

		return {
			id: row.id,
			slug: row.slug,
			title: row.title,
			themeKey: row.themeKey,
			sidebarEnabled: row.sidebarEnabled,
			document: draft,
			documentVersion: row.documentVersion,
			draftDocument: draft,
			publishedDocument: published,
		};
	}

	async createPage(data: CreatePageInput): Promise<PageSummaryDto> {
		const slug = this.normalizeSlug(data.slug ?? '');
		const title = (data.title ?? '').trim();
		if (!slug) throw new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.SLUG_REQUIRED);
		if (!title) throw new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.TITLE_REQUIRED);

		try {
			const row = await this.prisma.page.create({
				data: {
					slug,
					title,
					themeKey: data.themeKey ?? 'default',
					sidebarEnabled: data.sidebarEnabled ?? false,
					draftDocument: EMPTY_DOCUMENT as unknown as Prisma.InputJsonValue,
					publishedDocument: EMPTY_DOCUMENT as unknown as Prisma.InputJsonValue,
				},
			});
			return {
				id: row.id,
				slug: row.slug,
				title: row.title,
				themeKey: row.themeKey,
				sidebarEnabled: row.sidebarEnabled,
				hasPublished: true,
				documentVersion: row.documentVersion,
			};
		} catch (err) {
			if (isUniqueViolation(err)) {
				throw new HttpError(StatusCodes.CONFLICT, ApiMessage.PAGE_SLUG_EXISTS(slug));
			}
			throw err;
		}
	}

	async updatePageMeta(id: number, data: UpdatePageMetaInput): Promise<PageSummaryDto | null> {
		const existing = await this.prisma.page.findFirst({ where: { id, deletedAt: null } });
		if (!existing) return null;

		const newSlug = data.slug !== undefined ? this.normalizeSlug(data.slug) : undefined;

		if (newSlug && newSlug !== existing.slug) {
			await this.prisma.pageRedirect.upsert({
				where: { fromSlug: existing.slug },
				create: { fromSlug: existing.slug, toSlug: newSlug },
				update: { toSlug: newSlug },
			});
		}

		try {
			const row = await this.prisma.page.update({
				where: { id },
				data: {
					slug: newSlug,
					title: data.title?.trim(),
					themeKey: data.themeKey,
					sidebarEnabled: data.sidebarEnabled,
				},
			});
			return {
				id: row.id,
				slug: row.slug,
				title: row.title,
				themeKey: row.themeKey,
				sidebarEnabled: row.sidebarEnabled,
				hasPublished: row.publishedDocument !== null,
				documentVersion: row.documentVersion,
			};
		} catch (err) {
			if (isRecordNotFound(err)) return null;
			if (isUniqueViolation(err)) {
				throw new HttpError(StatusCodes.CONFLICT, ApiMessage.PAGE_SLUG_CONFLICT);
			}
			throw err;
		}
	}

	async autosaveDraft(
		slug: string,
		document: unknown,
		expectedVersion: number,
	): Promise<{ documentVersion: number }> {
		if (!isPageDocument(document)) {
			throw new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.DOCUMENT_BLOCKS_REQUIRED);
		}

		const resolved = await this.resolveSlug(slug);
		const row = await this.prisma.page.findFirst({
			where: { slug: resolved, deletedAt: null },
		});
		if (!row) throw new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PAGE_NOT_FOUND);

		if (row.documentVersion !== expectedVersion) {
			throw new HttpError(StatusCodes.CONFLICT, ApiMessage.DOCUMENT_VERSION_STALE);
		}

		const updated = await this.prisma.page.update({
			where: { id: row.id },
			data: {
				draftDocument: document as Prisma.InputJsonValue,
				documentVersion: { increment: 1 },
			},
			select: { documentVersion: true },
		});

		return { documentVersion: updated.documentVersion };
	}

	async publish(slug: string): Promise<PublicPageDto> {
		const resolved = await this.resolveSlug(slug);
		const row = await this.prisma.page.findFirst({
			where: { slug: resolved, deletedAt: null },
		});
		if (!row) throw new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PAGE_NOT_FOUND);

		const draft = parsePageDocument(row.draftDocument);

		const published = await this.prisma.$transaction(async (tx) => {
			const updated = await tx.page.update({
				where: { id: row.id },
				data: {
					publishedDocument: draft as unknown as Prisma.InputJsonValue,
				},
			});

			await tx.pageVersion.create({
				data: {
					pageId: row.id,
					document: draft as unknown as Prisma.InputJsonValue,
				},
			});

			return updated;
		});

		return {
			id: published.id,
			slug: published.slug,
			title: published.title,
			themeKey: published.themeKey,
			sidebarEnabled: published.sidebarEnabled,
			document: draft,
		};
	}

	async listVersions(slug: string): Promise<PageVersionDto[]> {
		const resolved = await this.resolveSlug(slug);
		const page = await this.prisma.page.findFirst({
			where: { slug: resolved, deletedAt: null },
			select: { id: true },
		});
		if (!page) throw new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PAGE_NOT_FOUND);

		const rows = await this.prisma.pageVersion.findMany({
			where: { pageId: page.id },
			orderBy: { createdAt: 'desc' },
			select: { id: true, pageId: true, createdAt: true, createdBy: true },
		});

		return rows.map((r) => ({
			id: r.id,
			pageId: r.pageId,
			createdAt: r.createdAt.toISOString(),
			createdBy: r.createdBy,
		}));
	}

	async getVersion(slug: string, versionId: number): Promise<PageVersionDetailDto> {
		const resolved = await this.resolveSlug(slug);
		const page = await this.prisma.page.findFirst({
			where: { slug: resolved, deletedAt: null },
			select: { id: true },
		});
		if (!page) throw new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PAGE_NOT_FOUND);

		const version = await this.prisma.pageVersion.findFirst({
			where: { id: versionId, pageId: page.id },
			select: { id: true, pageId: true, createdAt: true, createdBy: true, document: true },
		});
		if (!version) throw new HttpError(StatusCodes.NOT_FOUND, ApiMessage.VERSION_NOT_FOUND);

		return {
			id: version.id,
			pageId: version.pageId,
			createdAt: version.createdAt.toISOString(),
			createdBy: version.createdBy,
			document: parsePageDocument(version.document),
		};
	}

	async restoreVersion(slug: string, versionId: number): Promise<DraftPageDto> {
		const resolved = await this.resolveSlug(slug);
		const page = await this.prisma.page.findFirst({
			where: { slug: resolved, deletedAt: null },
		});
		if (!page) throw new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PAGE_NOT_FOUND);

		const version = await this.prisma.pageVersion.findFirst({
			where: { id: versionId, pageId: page.id },
		});
		if (!version) throw new HttpError(StatusCodes.NOT_FOUND, ApiMessage.VERSION_NOT_FOUND);

		const document = parsePageDocument(version.document);

		const updated = await this.prisma.page.update({
			where: { id: page.id },
			data: {
				draftDocument: document as unknown as Prisma.InputJsonValue,
				documentVersion: { increment: 1 },
			},
		});

		return {
			id: updated.id,
			slug: updated.slug,
			title: updated.title,
			themeKey: updated.themeKey,
			sidebarEnabled: updated.sidebarEnabled,
			document,
			documentVersion: updated.documentVersion,
			draftDocument: document,
			publishedDocument:
				updated.publishedDocument !== null
					? parsePageDocument(updated.publishedDocument)
					: null,
		};
	}

	async softDelete(id: number): Promise<boolean> {
		try {
			await this.prisma.page.update({
				where: { id },
				data: { deletedAt: new Date() },
			});
			return true;
		} catch (err) {
			if (isRecordNotFound(err)) return false;
			throw err;
		}
	}
}

function isUniqueViolation(err: unknown): boolean {
	const code =
		typeof err === 'object' && err !== null && 'code' in err
			? (err as { code?: unknown }).code
			: undefined;
	return code === 'P2002' || code === '23505';
}

function isRecordNotFound(err: unknown): boolean {
	return (
		typeof err === 'object' &&
		err !== null &&
		'code' in err &&
		(err as { code?: unknown }).code === 'P2025'
	);
}

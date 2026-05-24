import type { Prisma, PrismaClient } from '../generated/prisma/client.js';
import { HttpError } from '../shared/errors.js';

export interface TaxonomyDto {
	id: number;
	slug: string;
	label: string;
	sortOrder?: number;
}

export interface PersonDto {
	id: number;
	lastName: string;
	firstName: string;
	patronymic: string | null;
	displayName: string;
	subtitle: string | null;
	yearFrom: number;
	yearTo: number | null;
	yearsLabel: string;
	shortDescription: string | null;
	fullDescription: string | null;
	img: string | null;
	sortOrder: number;
	roleSlugs: string[];
	tagSlugs: string[];
	categorySlugs: string[];
	images: string[];
	files: Array<{ title: string; src: string }>;
}

export interface ListPeopleFilters {
	q?: string;
	roleSlug?: string;
	tagSlug?: string;
	categorySlug?: string;
}

export interface PersonMutationInput {
	lastName?: string;
	firstName?: string;
	patronymic?: string | null;
	subtitle?: string | null;
	yearFrom?: number;
	yearTo?: number | null;
	shortDescription?: string | null;
	fullDescription?: string | null;
	img?: string | null;
	sortOrder?: number;
	roleSlugs?: string[];
	tagSlugs?: string[];
	categorySlugs?: string[];
	images?: string[];
	files?: Array<{ title?: string; url: string }>;
}

export function formatDisplayName(p: {
	lastName: string;
	firstName: string;
	patronymic: string | null;
}): string {
	return [p.lastName, p.firstName, p.patronymic].filter(Boolean).join(' ');
}

export function formatYearsLabel(yearFrom: number, yearTo: number | null): string {
	if (yearTo !== null && yearTo !== yearFrom) return `${yearFrom} — ${yearTo}`;
	return String(yearFrom);
}

type PersonWithRelations = Prisma.PersonGetPayload<{
	include: typeof personInclude;
}>;

function toDto(row: PersonWithRelations): PersonDto {
	const images = row.media.map((m) => m.asset.src);
	const files = row.documents.map((d) => ({
		title: d.title,
		src: d.asset.src,
	}));

	return {
		id: row.id,
		lastName: row.lastName,
		firstName: row.firstName,
		patronymic: row.patronymic,
		displayName: formatDisplayName(row),
		subtitle: row.subtitle,
		yearFrom: row.yearFrom,
		yearTo: row.yearTo,
		yearsLabel: formatYearsLabel(row.yearFrom, row.yearTo),
		shortDescription: row.shortDescription,
		fullDescription: row.fullDescription,
		img: row.img,
		sortOrder: row.sortOrder,
		roleSlugs: row.roles.map((r) => r.role.slug),
		tagSlugs: row.tags.map((t) => t.tag.slug),
		categorySlugs: row.categories.map((c) => c.category.slug),
		images,
		files,
	};
}

const personInclude = {
	roles: { include: { role: true } },
	tags: { include: { tag: true } },
	categories: { include: { category: true } },
	media: { include: { asset: true }, orderBy: { mediaAssetId: 'asc' as const } },
	documents: { include: { asset: true } },
} satisfies Prisma.PersonInclude;

function resolveNameFields(data: PersonMutationInput): {
	lastName: string;
	firstName: string;
	patronymic: string | null;
} {
	return {
		lastName: data.lastName ?? '',
		firstName: data.firstName ?? '',
		patronymic: data.patronymic ?? null,
	};
}

function resolveYearsFields(data: PersonMutationInput): {
	yearFrom: number;
	yearTo: number | null;
} {
	return {
		yearFrom: data.yearFrom ?? 0,
		yearTo: data.yearTo ?? null,
	};
}

export class PeopleService {
	constructor(private prisma: PrismaClient) {}

	async getById(id: number): Promise<PersonDto | null> {
		const row = await this.prisma.person.findFirst({
			where: { id, deletedAt: null },
			include: personInclude,
		});
		return row ? toDto(row) : null;
	}

	async listAll(filters: ListPeopleFilters = {}): Promise<PersonDto[]> {
		const q = filters.q?.trim();
		const where: Prisma.PersonWhereInput = { deletedAt: null };

		if (q) {
			where.OR = [
				{ lastName: { contains: q, mode: 'insensitive' } },
				{ firstName: { contains: q, mode: 'insensitive' } },
				{ patronymic: { contains: q, mode: 'insensitive' } },
				{ subtitle: { contains: q, mode: 'insensitive' } },
				{ shortDescription: { contains: q, mode: 'insensitive' } },
				{ fullDescription: { contains: q, mode: 'insensitive' } },
			];
		}
		if (filters.roleSlug) {
			where.roles = { some: { role: { slug: filters.roleSlug } } };
		}
		if (filters.tagSlug) {
			where.tags = { some: { tag: { slug: filters.tagSlug } } };
		}
		if (filters.categorySlug) {
			where.categories = { some: { category: { slug: filters.categorySlug } } };
		}

		const rows = await this.prisma.person.findMany({
			where,
			orderBy: [{ sortOrder: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
			include: personInclude,
		});
		return rows.map(toDto);
	}

	async createPerson(data: PersonMutationInput): Promise<PersonDto> {
		const { lastName, firstName, patronymic } = resolveNameFields(data);
		const { yearFrom, yearTo } = resolveYearsFields(data);

		return this.prisma.$transaction(async (tx) => {
			const maxOrder = await tx.person.aggregate({
				where: { deletedAt: null },
				_max: { sortOrder: true },
			});
			const sortOrder = data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1;

			const person = await tx.person.create({
				data: {
					lastName,
					firstName,
					patronymic,
					subtitle: data.subtitle ?? null,
					yearFrom,
					yearTo,
					shortDescription: data.shortDescription ?? null,
					fullDescription: data.fullDescription ?? null,
					img: data.img ?? null,
					sortOrder,
				},
			});

			await this.syncTaxonomies(tx, person.id, data);
			await this.attachMedia(tx, person.id, data.images ?? [], data.files ?? []);

			const fresh = await tx.person.findUniqueOrThrow({
				where: { id: person.id },
				include: personInclude,
			});
			return toDto(fresh);
		});
	}

	async updatePerson(id: number, data: PersonMutationInput): Promise<PersonDto | null> {
		const existing = await this.prisma.person.findFirst({
			where: { id, deletedAt: null },
		});
		if (!existing) return null;

		const namePatch =
			data.lastName !== undefined ||
			data.firstName !== undefined ||
			data.patronymic !== undefined;
		const yearsPatch = data.yearFrom !== undefined || data.yearTo !== undefined;

		return this.prisma.$transaction(async (tx) => {
			const updateData: Prisma.PersonUpdateInput = {};

			if (namePatch) {
				const resolved = resolveNameFields({
					lastName: data.lastName ?? existing.lastName,
					firstName: data.firstName ?? existing.firstName,
					patronymic:
						data.patronymic !== undefined ? data.patronymic : existing.patronymic,
				});
				updateData.lastName = resolved.lastName;
				updateData.firstName = resolved.firstName;
				updateData.patronymic = resolved.patronymic;
			}
			if (yearsPatch) {
				const resolved = resolveYearsFields({
					yearFrom: data.yearFrom ?? existing.yearFrom,
					yearTo: data.yearTo !== undefined ? data.yearTo : existing.yearTo,
				});
				updateData.yearFrom = resolved.yearFrom;
				updateData.yearTo = resolved.yearTo;
			}
			if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
			if (data.shortDescription !== undefined)
				updateData.shortDescription = data.shortDescription;
			if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription;
			if (data.img !== undefined) updateData.img = data.img;
			if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

			if (Object.keys(updateData).length > 0) {
				await tx.person.update({ where: { id }, data: updateData });
			}

			if (
				data.roleSlugs !== undefined ||
				data.tagSlugs !== undefined ||
				data.categorySlugs !== undefined
			) {
				await this.syncTaxonomies(tx, id, data);
			}

			if (data.images !== undefined || data.files !== undefined) {
				await tx.personMedia.deleteMany({ where: { personId: id } });
				await tx.personDocument.deleteMany({ where: { personId: id } });
				await this.attachMedia(tx, id, data.images ?? [], data.files ?? []);
			}

			const fresh = await tx.person.findUnique({
				where: { id },
				include: personInclude,
			});
			return fresh ? toDto(fresh) : null;
		});
	}

	private async syncTaxonomies(
		tx: Prisma.TransactionClient,
		personId: number,
		data: PersonMutationInput,
	): Promise<void> {
		if (data.roleSlugs !== undefined) {
			await tx.personRole.deleteMany({ where: { personId } });
			for (const slug of data.roleSlugs) {
				const roleId = await this.ensureRoleTx(tx, slug, slug);
				await tx.personRole.create({ data: { personId, roleId } });
			}
		}
		if (data.tagSlugs !== undefined) {
			await tx.personTag.deleteMany({ where: { personId } });
			for (const slug of data.tagSlugs) {
				const tagId = await this.ensureTagTx(tx, slug, slug);
				await tx.personTag.create({ data: { personId, tagId } });
			}
		}
		if (data.categorySlugs !== undefined) {
			await tx.personCategory.deleteMany({ where: { personId } });
			for (const slug of data.categorySlugs) {
				const categoryId = await this.ensureCategoryTx(tx, slug, slug);
				await tx.personCategory.create({ data: { personId, categoryId } });
			}
		}
	}

	private async ensureRoleTx(
		tx: Prisma.TransactionClient,
		slug: string,
		label: string,
	): Promise<number> {
		const row = await tx.role.upsert({
			where: { slug },
			create: { slug, label },
			update: { label },
		});
		return row.id;
	}

	private async ensureTagTx(
		tx: Prisma.TransactionClient,
		slug: string,
		label: string,
	): Promise<number> {
		const row = await tx.tag.upsert({
			where: { slug },
			create: { slug, label },
			update: { label },
		});
		return row.id;
	}

	private async ensureCategoryTx(
		tx: Prisma.TransactionClient,
		slug: string,
		label: string,
	): Promise<number> {
		const row = await tx.category.upsert({
			where: { slug },
			create: { slug, label },
			update: { label },
		});
		return row.id;
	}

	async listTaxonomy(): Promise<{
		roles: TaxonomyDto[];
		tags: TaxonomyDto[];
		categories: TaxonomyDto[];
	}> {
		const [roles, tags, categories] = await Promise.all([
			this.prisma.role.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] }),
			this.prisma.tag.findMany({ orderBy: { label: 'asc' } }),
			this.prisma.category.findMany({ orderBy: { label: 'asc' } }),
		]);
		return {
			roles: roles.map((r) => ({
				id: r.id,
				slug: r.slug,
				label: r.label,
				sortOrder: r.sortOrder,
			})),
			tags: tags.map((t) => ({ id: t.id, slug: t.slug, label: t.label })),
			categories: categories.map((c) => ({ id: c.id, slug: c.slug, label: c.label })),
		};
	}

	async createRole(input: { slug: string; label: string; sortOrder?: number }): Promise<TaxonomyDto> {
		const slug = input.slug.trim();
		if (!slug) throw new HttpError(400, 'slug обязателен');
		const row = await this.prisma.role.create({
			data: {
				slug,
				label: input.label.trim() || slug,
				sortOrder: input.sortOrder ?? 0,
			},
		});
		return { id: row.id, slug: row.slug, label: row.label, sortOrder: row.sortOrder };
	}

	async updateRole(
		id: number,
		input: { slug?: string; label?: string; sortOrder?: number },
	): Promise<TaxonomyDto | null> {
		try {
			const row = await this.prisma.role.update({
				where: { id },
				data: {
					slug: input.slug?.trim(),
					label: input.label?.trim(),
					sortOrder: input.sortOrder,
				},
			});
			return { id: row.id, slug: row.slug, label: row.label, sortOrder: row.sortOrder };
		} catch {
			return null;
		}
	}

	async deleteRole(id: number): Promise<boolean> {
		try {
			await this.prisma.role.delete({ where: { id } });
			return true;
		} catch {
			return false;
		}
	}

	async createTag(input: { slug: string; label: string }): Promise<TaxonomyDto> {
		const slug = input.slug.trim();
		if (!slug) throw new HttpError(400, 'slug обязателен');
		const row = await this.prisma.tag.create({
			data: { slug, label: input.label.trim() || slug },
		});
		return { id: row.id, slug: row.slug, label: row.label };
	}

	async updateTag(
		id: number,
		input: { slug?: string; label?: string },
	): Promise<TaxonomyDto | null> {
		try {
			const row = await this.prisma.tag.update({
				where: { id },
				data: { slug: input.slug?.trim(), label: input.label?.trim() },
			});
			return { id: row.id, slug: row.slug, label: row.label };
		} catch {
			return null;
		}
	}

	async deleteTag(id: number): Promise<boolean> {
		try {
			await this.prisma.tag.delete({ where: { id } });
			return true;
		} catch {
			return false;
		}
	}

	async createCategory(input: { slug: string; label: string }): Promise<TaxonomyDto> {
		const slug = input.slug.trim();
		if (!slug) throw new HttpError(400, 'slug обязателен');
		const row = await this.prisma.category.create({
			data: { slug, label: input.label.trim() || slug },
		});
		return { id: row.id, slug: row.slug, label: row.label };
	}

	async updateCategory(
		id: number,
		input: { slug?: string; label?: string },
	): Promise<TaxonomyDto | null> {
		try {
			const row = await this.prisma.category.update({
				where: { id },
				data: { slug: input.slug?.trim(), label: input.label?.trim() },
			});
			return { id: row.id, slug: row.slug, label: row.label };
		} catch {
			return null;
		}
	}

	async deleteCategory(id: number): Promise<boolean> {
		try {
			await this.prisma.category.delete({ where: { id } });
			return true;
		} catch {
			return false;
		}
	}

	private async attachMedia(
		tx: Prisma.TransactionClient,
		personId: number,
		images: string[],
		files: Array<{ title?: string; url: string }>,
	): Promise<void> {
		for (const src of images.filter((s) => s.trim())) {
			const asset = await tx.mediaAsset.create({
				data: {
					src,
					mimeType: guessMime(src),
					title: null,
				},
			});
			await tx.personMedia.create({
				data: { personId, mediaAssetId: asset.id },
			});
		}

		for (const f of files.filter((f) => f.url.trim())) {
			const asset = await tx.mediaAsset.create({
				data: {
					src: f.url,
					mimeType: 'application/pdf',
					title: f.title ?? null,
				},
			});
			await tx.personDocument.create({
				data: {
					personId,
					mediaAssetId: asset.id,
					title: (f.title ?? 'Документ').trim(),
				},
			});
		}
	}

	async softDelete(id: number): Promise<boolean> {
		try {
			await this.prisma.person.update({
				where: { id },
				data: { deletedAt: new Date() },
			});
			return true;
		} catch {
			return false;
		}
	}

	async reorder(orderedIds: number[]): Promise<void> {
		const ids = orderedIds.filter((n) => Number.isFinite(n));
		await this.prisma.$transaction(async (tx) => {
			for (let i = 0; i < ids.length; i++) {
				await tx.person.update({
					where: { id: ids[i] },
					data: { sortOrder: i },
				});
			}
		});
	}
}

function guessMime(src: string): string {
	const lower = src.toLowerCase();
	if (lower.endsWith('.png')) return 'image/png';
	if (lower.endsWith('.webp')) return 'image/webp';
	if (lower.endsWith('.gif')) return 'image/gif';
	if (lower.endsWith('.mp4') || lower.endsWith('.webm')) return 'video/mp4';
	if (lower.endsWith('.pdf')) return 'application/pdf';
	return 'image/jpeg';
}

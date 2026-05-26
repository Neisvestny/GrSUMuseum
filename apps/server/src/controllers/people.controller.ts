import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { ListPeopleFilters, PeopleService, PersonMutationInput } from '../services/people.service.js';
import { ApiMessage } from '../shared/api-messages.js';
import { HttpError } from '../shared/errors.js';

function parseMutation(body: unknown): PersonMutationInput {
	const b = (body ?? {}) as Record<string, unknown>;
	return {
		lastName: typeof b.lastName === 'string' ? b.lastName : undefined,
		firstName: typeof b.firstName === 'string' ? b.firstName : undefined,
		patronymic:
			typeof b.patronymic === 'string' ? b.patronymic : b.patronymic === null ? null : undefined,
		subtitle: typeof b.subtitle === 'string' ? b.subtitle : undefined,
		yearFrom: typeof b.yearFrom === 'number' ? b.yearFrom : undefined,
		yearTo: typeof b.yearTo === 'number' ? b.yearTo : b.yearTo === null ? null : undefined,
		shortDescription: typeof b.shortDescription === 'string' ? b.shortDescription : undefined,
		fullDescription: typeof b.fullDescription === 'string' ? b.fullDescription : undefined,
		img: typeof b.img === 'string' ? b.img : undefined,
		sortOrder: typeof b.sortOrder === 'number' ? b.sortOrder : undefined,
		roleSlugs: Array.isArray(b.roleSlugs)
			? (b.roleSlugs as string[]).filter((s) => typeof s === 'string')
			: undefined,
		tagSlugs: Array.isArray(b.tagSlugs)
			? (b.tagSlugs as string[]).filter((s) => typeof s === 'string')
			: undefined,
		categorySlugs: Array.isArray(b.categorySlugs)
			? (b.categorySlugs as string[]).filter((s) => typeof s === 'string')
			: undefined,
		images: Array.isArray(b.images) ? (b.images as string[]) : undefined,
		files: Array.isArray(b.files)
			? (b.files as Array<{ title?: string; url: string }>)
			: undefined,
	};
}

function parseFilters(query: Request['query']): ListPeopleFilters {
	return {
		q: typeof query.q === 'string' ? query.q : undefined,
		roleSlug: typeof query.role === 'string' ? query.role : undefined,
		tagSlug: typeof query.tag === 'string' ? query.tag : undefined,
		categorySlug: typeof query.category === 'string' ? query.category : undefined,
	};
}

export class PeopleController {
	constructor(private people: PeopleService) {}

	list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const list = await this.people.listAll(parseFilters(req.query));
			res.json(list);
		} catch (err) {
			next(err);
		}
	};

	getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		try {
			const person = await this.people.getById(id);
			if (!person) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PERSON_NOT_FOUND));
				return;
			}
			res.json(person);
		} catch (err) {
			next(err);
		}
	};

	create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const person = await this.people.createPerson(parseMutation(req.body));
			res.status(StatusCodes.CREATED).json(person);
		} catch (err) {
			next(err);
		}
	};

	update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		try {
			const person = await this.people.updatePerson(id, parseMutation(req.body));
			if (!person) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PERSON_NOT_FOUND));
				return;
			}
			res.json(person);
		} catch (err) {
			next(err);
		}
	};

	reorder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const orderedIds = (req.body as { orderedIds?: number[] })?.orderedIds;
		if (!Array.isArray(orderedIds)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ORDERED_IDS_REQUIRED));
			return;
		}
		try {
			await this.people.reorder(orderedIds);
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		try {
			const ok = await this.people.softDelete(id);
			if (!ok) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PERSON_NOT_FOUND));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	getTaxonomy = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			res.json(await this.people.listTaxonomy());
		} catch (err) {
			next(err);
		}
	};

	createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const body = req.body as { slug?: string; label?: string; sortOrder?: number };
		try {
			const row = await this.people.createRole({
				slug: body.slug ?? '',
				label: body.label ?? '',
				sortOrder: body.sortOrder,
			});
			res.status(StatusCodes.CREATED).json(row);
		} catch (err) {
			next(err);
		}
	};

	updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		const body = req.body as { slug?: string; label?: string; sortOrder?: number };
		try {
			const row = await this.people.updateRole(id, body);
			if (!row) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.ROLE_NOT_FOUND));
				return;
			}
			res.json(row);
		} catch (err) {
			next(err);
		}
	};

	deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		try {
			const ok = await this.people.deleteRole(id);
			if (!ok) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.ROLE_DELETE_FAILED));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	createTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const body = req.body as { slug?: string; label?: string };
		try {
			const row = await this.people.createTag({ slug: body.slug ?? '', label: body.label ?? '' });
			res.status(StatusCodes.CREATED).json(row);
		} catch (err) {
			next(err);
		}
	};

	updateTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		const body = req.body as { slug?: string; label?: string };
		try {
			const row = await this.people.updateTag(id, body);
			if (!row) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.TAG_NOT_FOUND));
				return;
			}
			res.json(row);
		} catch (err) {
			next(err);
		}
	};

	deleteTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		try {
			const ok = await this.people.deleteTag(id);
			if (!ok) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.TAG_DELETE_FAILED));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const body = req.body as { slug?: string; label?: string };
		try {
			const row = await this.people.createCategory({
				slug: body.slug ?? '',
				label: body.label ?? '',
			});
			res.status(StatusCodes.CREATED).json(row);
		} catch (err) {
			next(err);
		}
	};

	updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		const body = req.body as { slug?: string; label?: string };
		try {
			const row = await this.people.updateCategory(id, body);
			if (!row) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.CATEGORY_NOT_FOUND));
				return;
			}
			res.json(row);
		} catch (err) {
			next(err);
		}
	};

	deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		try {
			const ok = await this.people.deleteCategory(id);
			if (!ok) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.CATEGORY_DELETE_FAILED));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};
}

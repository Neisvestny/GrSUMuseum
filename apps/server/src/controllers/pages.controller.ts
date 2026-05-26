import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { PagesService } from '../services/pages.service.js';
import { ApiMessage } from '../shared/api-messages.js';
import { HttpError } from '../shared/errors.js';

export class PagesController {
	constructor(private service: PagesService) {}

	listPages = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			res.json(await this.service.listPages());
		} catch (err) {
			next(err);
		}
	};

	getPublicBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const slug = paramString(req.params.slug);
		if (!slug) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.SLUG_REQUIRED));
			return;
		}
		try {
			const page = await this.service.getPublishedBySlug(slug);
			if (!page) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PAGE_NOT_FOUND));
				return;
			}
			res.json(page);
		} catch (err) {
			next(err);
		}
	};

	getByPath = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const path = typeof req.query.path === 'string' ? req.query.path.trim() : '';
		if (!path) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.PATH_REQUIRED));
			return;
		}
		try {
			const page = await this.service.getPublishedBySlug(path);
			if (!page) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PAGE_NOT_FOUND));
				return;
			}
			res.json(page);
		} catch (err) {
			next(err);
		}
	};

	getDraftBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const slug = paramString(req.params.slug);
		if (!slug) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.SLUG_REQUIRED));
			return;
		}
		try {
			const page = await this.service.getDraftBySlug(slug);
			if (!page) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PAGE_NOT_FOUND));
				return;
			}
			res.json(page);
		} catch (err) {
			next(err);
		}
	};

	getPageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		try {
			const page = await this.service.getPageById(id);
			if (!page) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PAGE_NOT_FOUND));
				return;
			}
			res.json(page);
		} catch (err) {
			next(err);
		}
	};

	createPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const page = await this.service.createPage(req.body ?? {});
			res.status(StatusCodes.CREATED).json(page);
		} catch (err) {
			next(err);
		}
	};

	updatePageMeta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		try {
			const page = await this.service.updatePageMeta(id, req.body ?? {});
			if (!page) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PAGE_NOT_FOUND));
				return;
			}
			res.json(page);
		} catch (err) {
			next(err);
		}
	};

	autosaveDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const slug = paramString(req.params.slug);
		const body = req.body as { document?: unknown; documentVersion?: number };
		if (!slug) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.SLUG_REQUIRED));
			return;
		}
		if (typeof body.documentVersion !== 'number') {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.DOCUMENT_VERSION_REQUIRED));
			return;
		}
		try {
			res.json(
				await this.service.autosaveDraft(slug, body.document, body.documentVersion),
			);
		} catch (err) {
			next(err);
		}
	};

	publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const slug = paramString(req.params.slug);
		if (!slug) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.SLUG_REQUIRED));
			return;
		}
		try {
			res.json(await this.service.publish(slug));
		} catch (err) {
			next(err);
		}
	};

	listVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const slug = paramString(req.params.slug);
		if (!slug) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.SLUG_REQUIRED));
			return;
		}
		try {
			res.json(await this.service.listVersions(slug));
		} catch (err) {
			next(err);
		}
	};

	getVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const slug = paramString(req.params.slug);
		const versionId = Number(req.params.versionId);
		if (!slug) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.SLUG_REQUIRED));
			return;
		}
		if (!Number.isFinite(versionId)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.VERSION_ID_MUST_BE_NUMBER));
			return;
		}
		try {
			res.json(await this.service.getVersion(slug, versionId));
		} catch (err) {
			next(err);
		}
	};

	restoreVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const slug = paramString(req.params.slug);
		const versionId = Number(req.params.versionId);
		if (!slug) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.SLUG_REQUIRED));
			return;
		}
		if (!Number.isFinite(versionId)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.VERSION_ID_MUST_BE_NUMBER));
			return;
		}
		try {
			res.json(await this.service.restoreVersion(slug, versionId));
		} catch (err) {
			next(err);
		}
	};

	deletePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(StatusCodes.BAD_REQUEST, ApiMessage.ID_MUST_BE_NUMBER));
			return;
		}
		try {
			const ok = await this.service.softDelete(id);
			if (!ok) {
				next(new HttpError(StatusCodes.NOT_FOUND, ApiMessage.PAGE_NOT_FOUND));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};
}

function paramString(value: string | string[] | undefined): string {
	if (typeof value === 'string') return value.trim();
	if (Array.isArray(value)) return (value[0] ?? '').trim();
	return '';
}

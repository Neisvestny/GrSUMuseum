import type { NextFunction, Request, Response } from 'express';
import type { PagesService } from '../services/pages.service';
import { HttpError } from '../shared/errors';

export class PagesController {
	constructor(private service: PagesService) {}

	listPages = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			res.json(await this.service.listPages());
		} catch (err) {
			next(err);
		}
	};

	getPageBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const raw = req.params.slug;
		const slug = (typeof raw === 'string' ? raw : (raw?.[0] ?? '')).trim();
		if (!slug) {
			next(new HttpError(400, 'slug обязателен'));
			return;
		}
		try {
			const page = await this.service.getPageBySlug(slug);
			if (!page) {
				next(new HttpError(404, 'Страница не найдена'));
				return;
			}
			res.json(page);
		} catch (err) {
			next(err);
		}
	};

	getPageByPath = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const raw = req.query.path;
		const path = (typeof raw === 'string' ? raw : '').trim();
		if (!path) {
			next(new HttpError(400, 'path обязателен'));
			return;
		}
		try {
			const page = await this.service.getPageByPath(path);
			if (!page) {
				next(new HttpError(404, 'Страница не найдена'));
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
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}
		try {
			const page = await this.service.getPageById(id);
			if (!page) {
				next(new HttpError(404, 'Страница не найдена'));
				return;
			}
			res.json(page);
		} catch (err) {
			next(err);
		}
	};

	createPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		if (!isPagePayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const page = await this.service.createPage(req.body);
			res.status(201).json(page);
		} catch (err) {
			next(err);
		}
	};

	updatePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}
		if (!isPagePayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const page = await this.service.updatePage(id, req.body);
			if (!page) {
				next(new HttpError(404, 'Страница не найдена'));
				return;
			}
			res.json(page);
		} catch (err) {
			next(err);
		}
	};

	deletePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const id = Number(req.params.id);
		if (!Number.isFinite(id)) {
			next(new HttpError(400, 'id должен быть числом'));
			return;
		}
		try {
			const ok = await this.service.deletePage(id);
			if (!ok) {
				next(new HttpError(404, 'Страница не найдена'));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	listTabs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const pageId = Number(req.params.pageId);
		if (!Number.isFinite(pageId)) {
			next(new HttpError(400, 'pageId должен быть числом'));
			return;
		}
		try {
			res.json(await this.service.listTabs(pageId));
		} catch (err) {
			next(err);
		}
	};

	createTab = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const pageId = Number(req.params.pageId);
		if (!Number.isFinite(pageId)) {
			next(new HttpError(400, 'pageId должен быть числом'));
			return;
		}
		if (!isTabPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const tab = await this.service.createTab(pageId, req.body);
			res.status(201).json(tab);
		} catch (err) {
			next(err);
		}
	};

	updateTab = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const tabId = Number(req.params.tabId);
		if (!Number.isFinite(tabId)) {
			next(new HttpError(400, 'tabId должен быть числом'));
			return;
		}
		if (!isTabPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const tab = await this.service.updateTab(tabId, req.body);
			if (!tab) {
				next(new HttpError(404, 'Вкладка не найдена'));
				return;
			}
			res.json(tab);
		} catch (err) {
			next(err);
		}
	};

	deleteTab = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const tabId = Number(req.params.tabId);
		if (!Number.isFinite(tabId)) {
			next(new HttpError(400, 'tabId должен быть числом'));
			return;
		}
		try {
			const ok = await this.service.deleteTab(tabId);
			if (!ok) {
				next(new HttpError(404, 'Вкладка не найдена'));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	createBlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		if (!isBlockPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const block = await this.service.createBlock(req.body);
			res.status(201).json(block);
		} catch (err) {
			next(err);
		}
	};

	updateBlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const blockId = Number(req.params.blockId);
		if (!Number.isFinite(blockId)) {
			next(new HttpError(400, 'blockId должен быть числом'));
			return;
		}
		if (!isBlockPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const block = await this.service.updateBlock(blockId, req.body);
			if (!block) {
				next(new HttpError(404, 'Блок не найден'));
				return;
			}
			res.json(block);
		} catch (err) {
			next(err);
		}
	};

	deleteBlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const blockId = Number(req.params.blockId);
		if (!Number.isFinite(blockId)) {
			next(new HttpError(400, 'blockId должен быть числом'));
			return;
		}
		try {
			const ok = await this.service.deleteBlock(blockId);
			if (!ok) {
				next(new HttpError(404, 'Блок не найден'));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};

	createParagraph = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const blockId = Number(req.params.blockId);
		if (!Number.isFinite(blockId)) {
			next(new HttpError(400, 'blockId должен быть числом'));
			return;
		}
		if (!isParagraphPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const paragraph = await this.service.createParagraph(blockId, req.body);
			res.status(201).json(paragraph);
		} catch (err) {
			next(err);
		}
	};

	updateParagraph = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const paragraphId = Number(req.params.paragraphId);
		if (!Number.isFinite(paragraphId)) {
			next(new HttpError(400, 'paragraphId должен быть числом'));
			return;
		}
		if (!isParagraphPayload(req.body)) {
			next(new HttpError(400, 'Некорректное тело запроса'));
			return;
		}
		try {
			const paragraph = await this.service.updateParagraph(paragraphId, req.body);
			if (!paragraph) {
				next(new HttpError(404, 'Параграф не найден'));
				return;
			}
			res.json(paragraph);
		} catch (err) {
			next(err);
		}
	};

	deleteParagraph = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const paragraphId = Number(req.params.paragraphId);
		if (!Number.isFinite(paragraphId)) {
			next(new HttpError(400, 'paragraphId должен быть числом'));
			return;
		}
		try {
			const ok = await this.service.deleteParagraph(paragraphId);
			if (!ok) {
				next(new HttpError(404, 'Параграф не найден'));
				return;
			}
			res.json({ success: true });
		} catch (err) {
			next(err);
		}
	};
}

function isPagePayload(value: unknown): value is {
	slug?: string;
	title?: string;
	template?: 'tabs_alternating' | 'alternating_blocks' | 'text_image' | 'tabs_text_image';
} {
	if (typeof value !== 'object' || value === null) return false;
	const data = value as Record<string, unknown>;
	return (
		(data.slug === undefined || typeof data.slug === 'string') &&
		(data.title === undefined || typeof data.title === 'string') &&
		(data.template === undefined ||
			data.template === 'tabs_alternating' ||
			data.template === 'alternating_blocks' ||
			data.template === 'text_image' ||
			data.template === 'tabs_text_image')
	);
}

function isTabPayload(value: unknown): value is { label?: string; position?: number } {
	if (typeof value !== 'object' || value === null) return false;
	const data = value as Record<string, unknown>;
	return (
		(data.label === undefined || typeof data.label === 'string') &&
		(data.position === undefined || typeof data.position === 'number')
	);
}

function isBlockPayload(value: unknown): value is {
	page_id?: number | null;
	tab_id?: number | null;
	img?: string | null;
	position?: number;
} {
	if (typeof value !== 'object' || value === null) return false;
	const data = value as Record<string, unknown>;
	return (
		(data.page_id === undefined || data.page_id === null || typeof data.page_id === 'number') &&
		(data.tab_id === undefined || data.tab_id === null || typeof data.tab_id === 'number') &&
		(data.img === undefined || data.img === null || typeof data.img === 'string') &&
		(data.position === undefined || typeof data.position === 'number')
	);
}

function isParagraphPayload(value: unknown): value is { text?: string; position?: number } {
	if (typeof value !== 'object' || value === null) return false;
	const data = value as Record<string, unknown>;
	return (
		(data.text === undefined || typeof data.text === 'string') &&
		(data.position === undefined || typeof data.position === 'number')
	);
}

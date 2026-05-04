import { Router } from 'express';
import { PagesController } from '../controllers/pages.controller';
import { prisma } from '../db/prisma';
import { PagesService } from '../services/pages.service';

const service = new PagesService(prisma);
const controller = new PagesController(service);

export const pagesRouter = Router();

// TODO: добавить middleware авторизации перед деструктивными операциями
// pagesRouter.use(authMiddleware);

// pages
pagesRouter.get('/', controller.listPages);
pagesRouter.get('/by-slug/:slug', controller.getPageBySlug);
pagesRouter.get('/:id', controller.getPageById);
pagesRouter.post('/', controller.createPage);
pagesRouter.put('/:id', controller.updatePage);
pagesRouter.delete('/:id', controller.deletePage);

// tabs (вложенные под страницу)
pagesRouter.get('/:pageId/tabs', controller.listTabs);
pagesRouter.post('/:pageId/tabs', controller.createTab);
pagesRouter.put('/tabs/:tabId', controller.updateTab);
pagesRouter.delete('/tabs/:tabId', controller.deleteTab);

// blocks (page_id или tab_id передаются в теле)
pagesRouter.post('/blocks', controller.createBlock);
pagesRouter.put('/blocks/:blockId', controller.updateBlock);
pagesRouter.delete('/blocks/:blockId', controller.deleteBlock);

// paragraphs (вложены под блок)
pagesRouter.post('/blocks/:blockId/paragraphs', controller.createParagraph);
pagesRouter.put('/paragraphs/:paragraphId', controller.updateParagraph);
pagesRouter.delete('/paragraphs/:paragraphId', controller.deleteParagraph);

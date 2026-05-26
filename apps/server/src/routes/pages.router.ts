import { Router } from 'express';
import { PagesController } from '../controllers/pages.controller.js';
import { prisma } from '../db/prisma.js';
import { PagesService } from '../services/pages.service.js';

const service = new PagesService(prisma);
const controller = new PagesController(service);

export const pagesRouter = Router();

pagesRouter.get('/', controller.listPages);
pagesRouter.get('/public/:slug', controller.getPublicBySlug);
pagesRouter.get('/by-path', controller.getByPath);
pagesRouter.get('/by-id/:id', controller.getPageById);
pagesRouter.post('/', controller.createPage);
pagesRouter.put('/by-id/:id', controller.updatePageMeta);
pagesRouter.delete('/by-id/:id', controller.deletePage);

pagesRouter.get('/:slug/draft', controller.getDraftBySlug);
pagesRouter.patch('/:slug/draft', controller.autosaveDraft);
pagesRouter.post('/:slug/publish', controller.publish);
pagesRouter.get('/:slug/versions', controller.listVersions);
pagesRouter.get('/:slug/versions/:versionId', controller.getVersion);
pagesRouter.post('/:slug/versions/:versionId/restore', controller.restoreVersion);

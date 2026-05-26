import { Router } from 'express';
import { PagesController } from '../controllers/pages.controller.js';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../app/middleware/require-auth.js';
import { PagesService } from '../services/pages.service.js';

const service = new PagesService(prisma);
const controller = new PagesController(service);

export const pagesRouter = Router();

pagesRouter.get('/public/:slug', controller.getPublicBySlug);
pagesRouter.get('/by-path', controller.getByPath);

const adminPagesRouter = Router();
adminPagesRouter.use(requireAuth);

adminPagesRouter.get('/', controller.listPages);
adminPagesRouter.get('/by-id/:id', controller.getPageById);
adminPagesRouter.post('/', controller.createPage);
adminPagesRouter.put('/by-id/:id', controller.updatePageMeta);
adminPagesRouter.delete('/by-id/:id', controller.deletePage);

adminPagesRouter.get('/:slug/draft', controller.getDraftBySlug);
adminPagesRouter.patch('/:slug/draft', controller.autosaveDraft);
adminPagesRouter.post('/:slug/publish', controller.publish);
adminPagesRouter.get('/:slug/versions', controller.listVersions);
adminPagesRouter.get('/:slug/versions/:versionId', controller.getVersion);
adminPagesRouter.post('/:slug/versions/:versionId/restore', controller.restoreVersion);

pagesRouter.use(adminPagesRouter);

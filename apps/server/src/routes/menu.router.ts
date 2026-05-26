import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller';
import { prisma } from '../db/prisma';
import { requireAuth } from '../app/middleware/require-auth.js';
import { MenuService } from '../services/menu.service';

const service = new MenuService(prisma);
const controller = new MenuController(service);

export const menuRouter = Router();

menuRouter.get('/:section', controller.listBySection);

const adminMenuRouter = Router();
adminMenuRouter.use(requireAuth);

adminMenuRouter.get('/', controller.listAll);
adminMenuRouter.post('/', controller.create);
adminMenuRouter.put('/:id', controller.update);
adminMenuRouter.delete('/:id', controller.delete);

menuRouter.use(adminMenuRouter);

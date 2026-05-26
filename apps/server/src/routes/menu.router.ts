import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller';
import { prisma } from '../db/prisma';
import { MenuService } from '../services/menu.service';

const service = new MenuService(prisma);
const controller = new MenuController(service);

export const menuRouter = Router();

// TODO: добавить middleware авторизации перед деструктивными операциями
// menuRouter.use(authMiddleware);

menuRouter.get('/', controller.listAll);
menuRouter.get('/:section', controller.listBySection);
menuRouter.post('/', controller.create);
menuRouter.put('/:id', controller.update);
menuRouter.delete('/:id', controller.delete);

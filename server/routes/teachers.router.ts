import { Router } from 'express';
import { TeachersController } from '../controllers/teachers.controller';
import { prisma } from '../db/prisma';
import { TeachersService } from '../services/teachers.service';

const service = new TeachersService(prisma);
const controller = new TeachersController(service);

export const teachersRouter = Router();

// TODO: добавить middleware авторизации перед деструктивными операциями
// teachersRouter.use(authMiddleware);

teachersRouter.get('/:section', controller.getAll);
teachersRouter.post('/:section/reset', controller.reset);
teachersRouter.post('/:section', controller.create);
teachersRouter.put('/:section/:position', controller.update);
teachersRouter.patch('/:section/reorder', controller.reorder);
teachersRouter.delete('/:section/:position', controller.delete);

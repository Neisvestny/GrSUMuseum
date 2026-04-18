import { Router } from 'express';
import { TeachersController } from '../controllers/teachers.controller';
import { pool } from '../db';
import { TeachersService } from '../services/teachers.service';

const service = new TeachersService(pool);
const controller = new TeachersController(service);

export const teachersRouter = Router();

// TODO: добавить middleware авторизации перед деструктивными операциями
// teachersRouter.use(authMiddleware);

teachersRouter.get('/:section', controller.getAll);
teachersRouter.post('/:section/reset', controller.reset); // ← ВАЖНО: до /:section/:position
teachersRouter.post('/:section', controller.create);
teachersRouter.put('/:section/:position', controller.update);
teachersRouter.delete('/:section/:position', controller.delete);

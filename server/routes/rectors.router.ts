import { Router } from 'express';
import { RectorsController } from '../controllers/rectors.controller';
import { pool } from '../db/pool';
import { RectorsService } from '../services/rectors.service';

const service = new RectorsService(pool);
const controller = new RectorsController(service);

export const rectorsRouter = Router();

// TODO: добавить middleware авторизации перед деструктивными операциями
// rectorsRouter.use(authMiddleware);

rectorsRouter.get('/', controller.getAll);
rectorsRouter.get('/:id', controller.getById);
rectorsRouter.post('/', controller.create);
rectorsRouter.put('/:id', controller.update);
rectorsRouter.delete('/:id', controller.delete);
